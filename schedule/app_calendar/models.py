#coding:UTF-8
from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.db.models.signals import *
from django.contrib import admin

ACTIIVITYMODEL = 'A'
TODOMODEL = 'T'
REMAINDERMODEL = 'R'
CALENDARMODELTYPE = (
	(ACTIIVITYMODEL,'活动'),
	(TODOMODEL,'待办事项'),
	(REMAINDERMODEL,'提醒'),
)#日程类型枚举
FIRSTDAYOFWEEK = (
	(0,'Sunday'),
	(1,'Monday'),
)
PRIORITY = (
	('L','低'),
	('M','中'),
	('H','高'),
	('E','紧急'),
)#紧急程度枚举

INTERVALTYPE = (
	('Y','年'),
	('M','月'),
	('W','周'),
	('D','日'),
	('m','分钟'),
)#重复日程的间隔类型

REPEATENDTYPE = (
	('N','Never'),
	('T','After times'),
	('D','After dates'),
)
DAYOFWEEK = (
	(0,'Sunday'),
	(1,'Monday'),
	(2,'Tuesday'),
	(3,'Wednesday'),
	(4,'Thursday'),
	(5,'Friday'),
	(6,'Saturday'),
)
PREMISSION = (
	(0,'VIEW'),
	(1,'CREATE'),
	(2,'EDIT'),
	(2,'DELETE')
)

# Create your models here.




class ModelBase(models.Model):
	"""	基础类，所有自定义类都从此类派生
	"""
	class Meta:
		abstract = True
	
	createDateTime = models.DateTimeField(null=True,auto_now = True,blank=True)
	createdBy = models.CharField(max_length=30,null=True,blank=True)

class CalendarType(ModelBase):
	"""	内建的日历类型
	"""
	name = models.CharField(max_length=30,unique=True,blank=True)
	calendarModelType = models.CharField(max_length=3,choices=CALENDARMODELTYPE,null=True)#表示适用于那种日程类型
	
	def __unicode__(self):
		return self.calendarModelType + ":" + self.	name
		
class CalendarBase(ModelBase):
	"""	日历抽象类，所有日历对象都从这个类派生
	"""
	class Meta:
		abstract = True
	
	beginDateTime = models.DateTimeField(null=True,blank=True)
	endDateTime = models.DateTimeField(null=True,blank=True)

	isWholeDay = models.BooleanField(default=True,blank=True)
	title = models.CharField(max_length = 100,null=True,blank=True)
	content = models.TextField()
	calendarType = models.ForeignKey(CalendarType,null=True,blank=True)
	user = models.ForeignKey(User,null=True,blank=True)
	# repeats = generic.GenericRelation('Repeat',
									# content_type_field='calendarType',
									# object_id_field='calendarId')
	# def __unicode__(self):
		# return str(self.__class__) + ':' + self.title
	
class Activity(CalendarBase):
	"""	活动类，继承自CalendarBase
	"""
	calendarBook = models.ForeignKey('CalendarBook')
	isOutDate = models.BooleanField(default=False)
	location = models.TextField(null=True,blank=True)
	repeat = models.OneToOneField('Repeat',null=True,blank=True)
	
	def save(self,*args,**kwargs):
		if self.endDateTime is None:
			self.endDateTime = self.beginDateTime
			
		if self.beginDateTime > self.endDateTime:
			return False
			
		super(Activity,self).save(*args,**kwargs)	
	
class ActivityPremission(ModelBase):
	"""活动权限类，表示所要通知的人员信息
	"""
	activity = models.ForeignKey('Activity')
	user = models.ForeignKey(User)
	premission = models.CommaSeparatedIntegerField(max_length=30,null=True)
	
class Todo (CalendarBase):
	"""	待办事项，继承自CalendarBase
	"""
	priority = models.CharField(max_length=1,default='M',choices=PRIORITY)
	nowPercent = models.IntegerField(default=0)
	actuallyEndDateTime = models.DateTimeField(null=True,blank=True)
	isFinished = models.BooleanField(default=False)
	parentTodo = models.ForeignKey('Todo')
	
class Reminder(CalendarBase):
	"""	提醒类，包括闹铃，定时提醒
	"""
	pass

class CalendarTypeInclude(ModelBase):
	"""	用户自建的日程类型
	"""
	name = models.CharField(max_length=30,unique=True)
	user = models.ForeignKey(User)
	calendarModelType = models.CharField(max_length=3,choices=CALENDARMODELTYPE)
	
class CalendarTypeExclude(ModelBase):
	"""	用户所删除的系统日程类型
	"""
	user = models.ForeignKey(User)
	calendarType = models.ForeignKey(CalendarType)
	

class CalendarBook(ModelBase):
	""" 日历本类，用于分类日历
	"""
	name = models.CharField(max_length=30)
	user = models.ForeignKey(User,null=True,blank=True)
	isPublic = models.BooleanField(default=False,blank=True)
	isDefault = models.BooleanField(default=False)
	introduction = models.TextField(null=True,blank=True)
	calendarModelType = models.CharField(default='A',max_length=3,choices=CALENDARMODELTYPE)
	
	
	def __unicode__(self):
		return self.name
		
class CalendarBookAuth(ModelBase):	
	""" 日历本权限类，记录每个日历本的授权情况
	"""
	grantor = models.ForeignKey(User,related_name="grantor")
	calendarBook = models.ForeignKey(CalendarBook)
	user = models.ForeignKey(User)
	premission = models.CommaSeparatedIntegerField(max_length=30,null=True,blank=True)
	
	def save(self,*args,**kwargs):
		"""	检查是否有重复授权,或者越权授权
		"""
		#重复授权
		if self.id is None:
			if CalendarBookAuth.objects.filter(calendarBook=self.calendarBook,user=self.user).count() != 0:
				return False
		
		#越权授权
		if self.calendarBook.user != self.grantor:
			return False
		
		super(CalendarBookAuth,self).save(*args, **kwargs)
		
		return True
	def __unicode__():
		return calendarBook + ":" +user

class CalendarBookSubscribe(ModelBase):
	"""	用户的日历本订阅信息
	"""
	user = models.ForeignKey(User,null=True,blank=True)
	calendarBook = models.ForeignKey(CalendarBook,null=True,blank=True)
	calendarBookAuth = models.ForeignKey(CalendarBookAuth,null=True,blank=True)
	
	@staticmethod
	def newSubscribe(user,**kwargs):
		#根据授权者来创建新的授权信息
		newSubscribes = []
		if 'grantor' in kwargs:
			auths = CalendarBookAuth.objects.filter(grantor=kwargs['grantor'],user=user)
			for au in auths:
				sub = CalendarBookSubscribe(user=user,calendarBook=au.calendarBook,calendarBookAuth=au)
				if sub.save() is True:
					newSubscribes.append(sub)
		
		elif 'books' in kwargs:
			for book in kwargs['books']:
				sub = CalendarBookSubscribe(user=user,calendarBook=book)
				if sub.save() is True:
					newSubscribes.append(sub)
		
		return newSubscribes
				 
			
	def isAuth(self):
		"""检查此订阅是否有效
		"""
		if self.calendarBook is not None: 
			if self.calendarBook.isDefault is True:
				return True
		
		if self.calendarBookAuth is not None:
			if self.calendarBookAuth.user == self.user and self.calendarBookAuth.calendarBook == self.calendarBook:
				return True
		
		return False
		
	def save(self,*args,**kwargs):
		"""	重载save方法，在save时检测是否发生了重复订阅
			另外还对设置了授权信息的订阅对象进行信息补全
		"""
		if self.id is None:
			subscribe = CalendarBookSubscribe.objects.filter(user__exact=self.user,calendarBook__exact=self.calendarBook)
			if subscribe.count() != 0:
				return False
		
		#信息补全
		if self.user is None or self.calendarBook is None:
			if self.calendarBookAuth is None:
				return False
			else:
				self.user = self.calendarBookAuth.user
				self.calendarBook = self.calendarBookAuth.calendarBook
		
		#校验授权信息
		if self.calendarBookAuth is not None:
			if self.calendarBookAuth.calendarBook != self.calendarBook:
				return False
			elif self.calendarBookAuth.user != self.user:
				return False
		else:
			if self.calendarBook.isPublic == False:
				return False
				
		#检验无误，进行保存
		super(CalendarBookSubscribe, self).save(*args, **kwargs)
		
		return True
		
class Repeat(ModelBase):
	"""	重复性日程的相关信息
	"""
	#begin-用于外键关联日程的字段
	# calendarType = models.ForeignKey(ContentType)#所关联外键日历对象类型信息
	# calendarId = models.PositiveIntegerField()#所关联外键日历对象Id
	# calendar = generic.GenericForeignKey('calendarType','calendarId')

	#end-用于外键关联日程的字段
	intervalType = models.CharField(max_length=1,choices=INTERVALTYPE)#间隔日期，日月年周日
	interval = models.IntegerField(null=True,blank=True)#间隔时间，单位根据间隔类型类确定
	week = models.BooleanField(default=False)#当间隔类型为月份时，此字段可表示为每个月的第几周
	dayOfWeek = models.CommaSeparatedIntegerField(max_length=15,null=True,blank=True)#表示重复事件发生在周几
	endType = models.CharField(max_length=1,choices=REPEATENDTYPE,default='N',blank=True)#表示重复的类型
	endTimes = models.IntegerField(null=True,blank=True)#如果结束类型为次数，则启用此字段
	endDateTime = models.DateTimeField(null=True,blank=True)#如果结束类型为日期，则启用此字段

class UserSetting(ModelBase):
	""" 用户相关的配置信息
	"""
	timezone = models.TextField(default='Asia/Shanghai')	#用户的时区
	firstDayOfWeek = models.IntegerField(default=0,choices=FIRSTDAYOFWEEK)
	user = models.OneToOneField(User)
	
	
	
	
	
def createUserProfile(sender, instance, created, **kwargs):
	if created:
		UserSetting.objects.create(user=instance)

def createUserCalendarBook(sender,instance,created,**kwargs):
	if created:
		CalendarBook.objects.create(name='默认日历本',user=instance,isDefault=True)

def onCalendarBookDelete(sender,instance,using,**kwargs):
	"""
	当发生默认日历本删除时间时，自动将下一本日历本设置为默认日历本
	"""
	if instance.isDefault == True:
		book = CalendarBook.objects.filter(user=instance.user) \
							.order_by('createDateTime')[0]
		
		book.isDefault = True
		book.save()
		
		
#注册事件
post_save.connect(createUserProfile,sender=User)
post_save.connect(createUserCalendarBook,sender=User)
pre_delete.connect(onCalendarBookDelete,sender=CalendarBook)


#注册admin管理
admin.site.register(Activity)
admin.site.register(CalendarBook)
admin.site.register(CalendarBookAuth)
admin.site.register(CalendarBookSubscribe)
admin.site.register(Repeat)
admin.site.register(UserSetting)