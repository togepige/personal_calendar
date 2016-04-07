from schedule.app_calendar.models import *
from django.db import models
from django.db.models import Q

class ActivityManager(models.Manager):
	"""
	活动管理类
	"""
	def getByDate(self,user,minDate,maxDate,book=None):
		from schedule.app_calendar.models import *
		qUser = Q(user__exact=user)
		q1 = Q(beginDateTime__lte=maxDate) & Q(beginDateTime__gte=minDate)
		q2 = Q(endDateTime__lte=maxDate) & Q(endDateTime__gte=minDate)
		qDate = q1 | q2
		
		if book is None:
			book = []
			#首先获取订阅到日历本
			subscribes = CalendarBookSubscribe.objects.filter(user=user)
			for sub in subscribes:
				book.append(sub.calendarBook)
			#获取本身的日历本
			book += list(user.calendarbook_set.all() \
						.order_by('-isDefault','-createDateTime'))
		
		if type(book) is not list:
			book = [book]
		
		qBook = Q(calendarBook__in = book)
		activities = self.get_query_set().filter(qBook,qDate).order_by('beginDateTime')
		return activities
		
class RepeatManager(models.Manager):
	"""
	重复信息的管理类
	"""
	def getByActivity(self,activities):
		from schedule.app_calendar.models import *
		
		repeats = []
		for act in activities:
			if act.repeat is not None:
				repeats.append(act.repeat)
		return repeats