#encoding=utf-8
from schedule.app_calendar.models import *
from django.contrib.auth.models import User
from schedule.app_calendar.exception import *
from datetime import *
from dateutil import *
from dateutil.parser import *
from dateutil.relativedelta import *
from schedule.app_calendar.tools import *
from django.db.models import Q



def getDefaultActivityBook(user,calendarBook=None):
	"""	获得用户的默认日历本
	"""
	if user is None:
		raise UserNotExist
	if calendarBook is not None:
		if calendarBook.user == user:
			return calendarBook
	#如果传入的calendarBook为空或者user不匹配，则返回默认的calendarBook
	calendarBooks = user.calendarbook_set.filter(isDefault__exact=True)
	if calendarBooks.count() == 0:
		calendarBook = CalendarBook(user=user,isDefault=True,name='默认日历本')
		calendarBook.save()
	else:
		calendarBook = calendarBooks[0]
	return calendarBook

def getCalendarBook(user,calendarModelType):
	"""	获得指定类型的用户的所有日历本
	"""
	print 'getCalendarBook'
	if user is None:
		return None
	#获取用户自身的日历本
	calendarBooks = user.calendarbook_set.all() \
							.order_by('-isDefault','-createDateTime')
	
	if calendarBooks.count() == 0:
		print 'not default'
		return getDefaultActivityBook(user)
	
	books = list(calendarBooks)
	
	return books

def newActivity(user,content,beginDateTime,activity=None,
				isWholeDay=True,endDateTime=None,
				location=None,isOutDate=False,calendarBook=None): 
	"""	根据传入参数创建一个新的活动
	"""
	if activity is None:
		activity = Activity(createdBy=user.username)
	# try:
		calendarBook = getDefaultActivityBook(user,calendarBook)
		activity.beginDateTime = beginDateTime
		activity.content = content
		activity.calendarBook = calendarBook
		activity.isWholeDay = isWholeDay
		activity.endDateTime = endDateTime
		activity.location = ""
		activity.isOutDate = False
		activity.save()
	# except:
		# return None
		
	return activity
	
def updateActivity(user,actObj=None,**args):
	"""
	根据传入的act对象键值对或者不定参数来创建或者更新日程活动
	"""
	
	if user is None:
		raise UserNotExist
		
	if type(actObj) != dict:
		print 0
		actObj = dict(args)
		
	print actObj	
	#针对每一个key value来设置
	#处理主键，判断是否进行修改或者新建
	print 1
	if 'pk' in actObj and isUndefined(actObj['pk']) is False:
		pk = actObj['pk']
		act = Activity.objects.get(pk=pk)
		if act is None:
			act = Activity()
	else:
		act = Activity()
		
	#时间处理
	print 2
	if 'beginDateTime' in actObj and isUndefined(actObj['beginDateTime']) is False:
		if isUndefined(actObj['beginDateTime']):
			if act.beginDateTime is None:
				return None
			
		if isinstance(actObj['beginDateTime'],datetime):
			act.beginDateTime = actObj['beginDateTime']
		else:
			act.beginDateTime = TimeZoneHelper().toUTC( \
									parse(actObj.get('beginDateTime',act.beginDateTime)) \
								)


	if 'endDateTime' in actObj and isUndefined(actObj['endDateTime']) is False:
		if isinstance(actObj['endDateTime'],datetime):
			act.endDateTime = actObj.get('endDateTime',act.endDateTime)
		else:
			act.endDateTime = TimeZoneHelper().toUTC( \
								parse(actObj.get('endDateTime',act.endDateTime)) \
							)
	
	print 3
	if 'isWholeDay' in actObj:
		if actObj.get('isWholeDay',"") == 'on' or actObj.get('isWholeDay',"") == 'true':
			act.isWholeDay = True
		elif actObj.get('isWholeDay',"") == 'false':
			act.isWholeDay = False
		else:
			if act.id is not None:
				act.isWholeDay = act.isWholeDay
			else:
				act.isWholeDay = True
				
		print act.isWholeDay
		
	print 4
	#标题title
	if 'title' in actObj and isUndefined(actObj['title']) is False:
		act.title = actObj.get('title',act.title)
	
	print 5
	#日历本
	if 'calendarBook' in actObj and isUndefined(actObj['calendarBook']) is False:
		calendarBook = CalendarBook.objects.get(pk=actObj.get('calendarBook',''))
		if calendarBook is None:
			calendarBook = getDefaultActivityBook(user)
		
		act.calendarBook = calendarBook
	else:
		if act.id is None:
			calendarBook = getDefaultActivityBook(user)
			act.calendarBook = calendarBook
	
	
	print 6
	#内容content
	if 'content' in actObj and isUndefined(actObj['content']) is False:
		act.content = actObj.get('content',act.content)
	
	print 7
	#地点location
	if 'location' in actObj and isUndefined(actObj['content']) is False:
		act.location = actObj.get('location',act.location)
	
	print 'ok'
	
	print 8

	#重复信息
	if actObj.get('isRepeat','') == 'true':
		repeat = act.repeat
		if repeat is None:
			repeat = Repeat()
		#重复类型
		repeat.intervalType = actObj['repeatType']
		if repeat.intervalType == 'workday':
			repeat.intervalType == 'W'
		if repeat.intervalType == 'W':
			repeat.dayOfWeek = actObj['repeatWeekday']
		
		repeat.interval = actObj['repeatInterval']
		
		repeat.endType = actObj['endType']
		if actObj['endType'] == 'T':
			repeat.endTimes = actObj['timesToEnd']
		elif actObj['endType'] == 'D':
			repeat.endDateTime = TimeZoneHelper().toUTC( \
						parse(actObj['dateToEnd']) \
					)
		
		repeat.save()
		act.repeat = repeat

	elif actObj.get('isRepeat','') == 'false':
		act.repeat = None
	
	
	
	if actObj.get("action",None) == 'delete':
		act.delete()
		act.id = pk
	else:
		act.save()
	return act
	
def getRepeats(activities):
	print 'getRepeats'
	
	repeats = [];
	for act in activities:
		if act.repeat is not None:
			repeats.append(act.repeat)
	return repeats
	
	
def getSubscribeBook(user):
	print 'getSubscribeBook'
	
	subscribe = CalendarBookSubscribe.objects.filter(user=user)
	
	books = []
	
	for s in subscribe:
		books.append(s.calendarBook)
	
	return books
	