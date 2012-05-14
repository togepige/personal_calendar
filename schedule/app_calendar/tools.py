from django.utils import simplejson
from django.contrib.auth.models import User
from django.core.validators import email_re,EmailValidator
from datetime import *
from django.db import models
from django.core.serializers import serialize,deserialize
from django.db.models.query import QuerySet
from django.contrib.auth import authenticate,login as dj_login
from message import *
from django.contrib.auth.models import *
from dateutil.tz import *
from dateutil.parser import *
from pytz import *
from schedule.app_calendar.exception import *
import pytz
import time
import re

emailValidator = EmailValidator(email_re)
UTC = pytz.UTC
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S.%fZ'
MESSAGE = MessageBase()

class JSONHelper():
	
	class MyEncoder(simplejson.JSONEncoder):
		""" 继承自simplejson的编码基类，用于处理复杂类型的编码
		"""
		def default(self,obj):
			if isinstance(obj,QuerySet):
				""" Queryset实例
				直接使用Django内置的序列化工具进行序列化
				但是如果直接返回serialize('json',obj)
				则在simplejson序列化时会被从当成字符串处理
				则会多出前后的双引号
				因此这里先获得序列化后的对象
				然后再用simplejson反序列化一次
				得到一个标准的字典（dict）对象
				"""
				return simplejson.loads(serialize('json',obj))
			if isinstance(obj,models.Model):
				"""
				如果传入的是单个对象，区别于QuerySet的就是
				Django不支持序列化单个对象
				因此，首先用单个对象来构造一个只有一个对象的数组
				这是就可以看做是QuerySet对象
				然后此时再用Django来进行序列化
				就如同处理QuerySet一样
				但是由于序列化QuerySet会被'[]'所包围
				因此使用string[1:-1]来去除
				由于序列化QuerySet而带入的'[]'
				"""
				return simplejson.loads(serialize('json',[obj])[1:-1])
			if isinstance(obj,list) and isinstance(obj[0],models.Model):
				"""
				如果是装有models类型的list的也同样用Django的
				序列化工具进行序列化
				"""
				return simplejson.loads(serialize('json',obj))
			if hasattr(obj, 'isoformat'): 
				#处理日期类型
				return obj.isoformat();
			return simplejson.JSONEncoder.default(self,obj)
	
	@staticmethod
	def getJSON(**args):
		"""	使用MyEncoder这个自定义的规则类来序列化对象
		"""
		result = dict(args)
		return simplejson.dumps(result,cls=JSONHelper.MyEncoder)
	
	@staticmethod
	def JSONBack(json):
		"""	进行Json字符串的反序列化
			一般来说，从网络得回的POST（或者GET）
			参数中所包含json数据
			例如，用POST传过来的参数中有一个key value键值对为
			request.POST['update'] 
			= "[{pk:1,name:'changename'},{pk:2,name:'changename2'}]"
			要将这个value进行反序列化
			则可以使用Django内置的序列化与反序列化
			但是问题在于
			传回的有可能是代表单个对象的json字符串
			如：
			request.POST['update'] = "{pk:1,name:'changename'}"
			这是，由于Django无法处理单个对象
			因此要做适当的处理
			将其模拟成一个数组，也就是用'[]'进行包围
			再进行反序列化
		"""
		if json[0] == '[':
			return deserialize('json',json)
		else:
			return deserialize('json','[' + json +']')
	
	@staticmethod
	def listToModal(list):
		"""	将Python的Dict对象反序列化为Modal对象
		"""
		if type(list) != 'list':
			list = [list]
		
		return deserialize('python',list)
	
class UserValidator():

	@staticmethod
	def passwordValidate(password,passwordConfirm=None):
		if len(password)<4:
			return MESSAGE.tooShort
		elif len(password)>30:
			return MESSAGE.tooLong
		elif passwordConfirm is not None:
			if password != passwordConfirm:
				return MESSAGE.passwordNotEqual
		return MESSAGE.success
		
	@staticmethod	
	def usernameValidate(username,isRegister = False):
		if len(username)<4:
			return MESSAGE.tooShort
		elif len(username)>30:
			return MESSAGE.tooLong
		#测试Email是否合法
		try:
			emailValidator(username)
		except:
			return MESSAGE.notEmail
		
		if (UserValidator.isUserExist(username) ^ isRegister) is False:
			if isRegister is True:
				return MESSAGE.userExist
			else :
				return MESSAGE.userNotExist
		
		return MESSAGE.success
		
	@staticmethod
	def isUserExist(username):
		"""
		此函数用来测试用户的用户名和密码的相关信息
		返回值及含义:
		"""
		try:
			u = User.objects.get(username__exact=username)
		except User.DoesNotExist:
			return False
		return True
	
	@staticmethod
	def validate(username,password,isRegister=False,passwordConfirm=None):
		message = UserValidator.usernameValidate(username,isRegister) 
		if message != MESSAGE.success:
			return message
		
		message = UserValidator.passwordValidate(password,passwordConfirm)
		if message != MESSAGE.success:
			return message
		
		return MESSAGE.success
	
	@staticmethod	
	def login(username,password,request,keepLogin=False):
		user = authenticate(username=username,password=password)
		if user is not None:
			if user.is_active:
				dj_login(request,user)
				#是否保持登录状态
				if keepLogin is False:
					request.session.set_expiry(0)
					request.session.save()
				return MESSAGE.success
			else:
				return MESSAGE.userNotActive
		else:
			return MESSAGE.passwordWrong
	
class TimeZoneHelper():

	@staticmethod
	def strToUTCDate(s,tz):
		"""
		这个方法将传入的日期转化成标准的UTC时间
		"""
		if isinstance(tz,str):
			tz = pytz.timezone(tz)
		elif isinstance(tz,int):
			tz = tzoffset(None,tz)
		elif isinstance(tz,User):
			tz = pytz.timezone(tz.get_profile().timezone)
		
		d = parse(s)
		if d.tzinfo is not None:
			d.astimezone(UTC)
		else:
			d = tz.localize(d)
			d.astimezone(UTC)
			
		return d
	
	@staticmethod
	def ISOToUTC(s):
		return TimeZoneHelper.toUTC(parse(s))
		
	
	@staticmethod
	def getTZFromOffset(offset):
		sign = offset[0]
		hourCount = offset[1:3]
		if len(offset) == 4:
			minuteCount = offset[3]
		else:
			minuteCount = offset[4]

		minutes = int(hourCount) * 60 * 60 + int(minuteCount) * 60
		if sign == "+":
			return tzoffset(None,-minutes)
		else:
			return tzoffset(None,+minutes)
	
	@staticmethod
	def now():
		return datetime.now(UTC)
	
	@staticmethod
	def toUTC(dt):
		if dt.tzinfo is None:
			raise NotAwareDateTimeException(dt)
		dt.astimezone(pytz.UTC)
		return dt

	
def isUserLogined(user):
	if user is not None and user.is_authenticated():
		return True
	return False

def isUndefined(obj):
	if obj is None or obj == "":
		return True
	else:
		return False

	