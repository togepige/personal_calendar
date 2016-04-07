# -*- coding: utf-8 -*-
# Create your views here.
from django.http import HttpResponse,HttpRequest,HttpResponseRedirect,Http404
from django.template import RequestContext,Context
from django.shortcuts import render_to_response, get_object_or_404,redirect
from django.utils import simplejson
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.models import User
from tools import *
from django.core.urlresolvers import reverse
from datetime import *
from schedule.app_calendar.models import * 
from schedule.app_calendar.dbaction import *
from django.core.serializers import deserialize
from django.db.models import Q
from dateutil import *
from dateutil.relativedelta import *
from dateutil.parser import *
import pytz
import string
import sys


MIMETYPE = {'json':'application/json',}
PASSWORD = "password"
USERNAME = "username"
FAILJSON = JSONHelper.getJSON(result='fail')

FAILRESPONSE = HttpResponse(FAILJSON,mimetype=MIMETYPE['json'])

@login_required
def base(request):

	print "session : " + request.session.session_key
	request.session.set_expiry(0)
	request.session.save()
	weekDays = ('星期天','星期一','星期二','星期三','星期四','星期五','星期六')
	context = Context({
		'weekDays':weekDays,
	})
	return render_to_response("calendar.html",context,context_instance=RequestContext(request))


def loginView(request):
	context = Context()
	return render_to_response("login.html",context,context_instance=RequestContext(request))


def register(request):
	context = Context()
	return render_to_response("register.html",context,context_instance=RequestContext(request))
	
		
def auth(request):
	"""
	进行登录验证
	"""
	#获取用户名密码
	username = request.POST.get('username',None)
	password = request.POST.get('password',None)
	nextURL = request.POST.get('next-url',"")
	keepLogin = request.POST.get('keep-login','off')
	message = UserValidator.validate(username,password)
	
	if keepLogin == 'on':
		keepLogin = True
	else:
		keepLogin = False
	
	if nextURL == "":
		nextURL = '/calendar'
	if message != MESSAGE.success:
		json = JSONHelper.getJSON(result=MESSAGE.fail,message=message)
	else:
		message = UserValidator.login(username,password,request,keepLogin)
		if message != MESSAGE.success:
			json = JSONHelper.getJSON(result=MESSAGE.fail,message=message)
		else :
			json = JSONHelper.getJSON(result=MESSAGE.success,nextURL=nextURL)
			
	return HttpResponse(json,mimetype=MIMETYPE['json'])

def reg(request):
	"""
	进行用户注册
	"""
	json = ""
	#获取注册信息
	username = request.POST['username']
	password = request.POST['password']
	passwordConfirm = request.POST['password-confirm']
	nextURL = request.POST['next']
	
	if nextURL == "":
		nextURL = '/calendar'
	#进行用户名和密码的检查
	message = UserValidator.validate(username,password,True,passwordConfirm)

	if message != MESSAGE.success:
		json = JSONHelper.getJSON(result=MESSAGE.fail,message=message)
	else:
		User.objects.create_user(username,username,password)
		message = UserValidator.login(username,password,request)
		if message != MESSAGE.success:
			json = JSONHelper.getJSON(result=MESSAGE.fail,message=message)
		else:
			json = JSONHelper.getJSON(result=MESSAGE.success,
									nextURL=nextURL)

	return HttpResponse(json,mimetype=MIMETYPE['json'])
	
def getActivity(request):
	"""	根据用户及传入日期获取响应的活动并传回浏览器
	"""
	print 'getActivity'
	user = request.user
	if isUserLogined(user) is not True:
		return FAILRESPONSE
		
	post = simplejson.loads(request.raw_post_data)
	
	dateArray = []
	
	for dS in post['date']:
		d = TimeZoneHelper.ISOToUTC(dS)
		dateArray.append(d)
	
	maxD = max(dateArray)
	minD = min(dateArray)
	
	activities = Activity.objects.getByDate(user,minD,maxD)

	repeats = Repeat.objects.getByActivity(activities)
	
	
	json = JSONHelper.getJSON(result='success',activity=activities,repeat=repeats)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

def getRepeatActivity(request):
	qRepeat = Q(repeat__isnull=False)
	#取出重复事件及重复信息
	repeatActivities = Activity.objects.select_related().filter(qRepeat).order_by('beginDateTime')
	repeats = Repeat.objects.getByActivity(activities)
	json = JSONHelper.getJSON(result='success',repeatActivity=repeatActivities,repeat=repeats)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

	
def getRequiredInfo(request):
	"""	获取日历显示的必要而不常更改的信息
	"""
	user = request.user
	if isUserLogined(user) is not True:
		return FAILRESPONSE
	
	calendarBooks = None
	userSetting = None
	#必有信息
	userSetting = user.get_profile()
	timezone = pytz.timezone(userSetting.timezone)
	tzAbbr = datetime.now(timezone).strftime('%Z')
	tzOffset = datetime.now(timezone).strftime('%z')
	today = TimeZoneHelper.now()
	
	result = JSONHelper.getJSON(result='success',
					tzAbbr=tzAbbr,
					tzOffset=tzOffset,
					today = today,
					user={'id':user.id,'username':user.username})
	return HttpResponse(result,mimetype=MIMETYPE['json'])

@login_required
def updateActivityDetail(request):

	user = request.user
	if isUserLogined(user) is False:
		return FAILRESPONSE
	
	actObj = {}
	actObj['pk'] = request.POST.get('pk',None)
	actObj['content'] = request.POST.get('content',None)
	actObj['title'] = request.POST.get('title',None)
	actObj['beginDateTime'] = request.POST.get('begin-datetime',None)
	actObj['endDateTime'] = request.POST.get('end-datetime',None)
	actObj['isWholeDay'] = request.POST.get('is-whole-day',None)
	actObj['location'] = request.POST.get('location',None)
	actObj['calendarBook'] = request.POST.get('calendar-book',None)
	actObj['action'] = request.POST.get('action',None)
	
	actObj['isRepeat'] = request.POST.get('is-repeat',None)
	actObj['repeatType'] = request.POST.get('repeat-type',None)
	actObj['repeatInterval'] = request.POST.get('repeat-interval',None)
	actObj['repeatWeekday'] = request.POST.get('repeat-weekday',None)
	actObj['endType'] = request.POST.get('end-type',None)
	actObj['timesToEnd']  = request.POST.get('times-to-end',None)
	actObj['dateToEnd']  = request.POST.get('date-to-end','')
	
	
	if isUndefined(actObj['pk']):
		action = 'new'
	elif isUndefined(actObj['action']) or actObj['action'] == 'update':
		action = 'update'
	elif actObj['action'] == 'delete':
		action = 'delete'
		
	result = updateActivity(user,actObj)
	
	print result
	
	if result is None:
		return FAILRESPONSE
	else:
		json =JSONHelper().getJSON(result=MESSAGE.success,activity=result,action=action,repeat=result.repeat)
		return HttpResponse(json,mimetype=MIMETYPE['json'])

@login_required
def updateCalendarBook(request):

	user = request.user

	if isUserLogined(user) is False:
		return FAILRESPONSE
		
	post = request.POST
	bookData = {}
	for key in post:
		bookData[key] = post.get(key,None)
	
	print bookData
	
	if 'action' not in bookData:
		action = 'update'
	else:
		action = bookData['action']
	
	#取出已有book进行更新，或者从新创建book
	if 'pk' in bookData:
		calendarBook = CalendarBook.objects.get(pk=bookData['pk'])
	else:
		calendarBook = CalendarBook()
		action = 'new'
	
	if 'name' in bookData:
		calendarBook.name = bookData['name']
	
	if 'introduction' in bookData:
		calendarBook.introduction = bookData['introduction']
			
	calendarBook.user = user
	
	#进行操作
	if action == 'new' or action == 'update':
		calendarBook.save()
	elif action == 'delete':
		calendarBook.delete()
		calendarBook.id = bookData['pk']
	
	
	json =JSONHelper().getJSON(result=MESSAGE.success,action=action,book=calendarBook)

	return HttpResponse(json,mimetype=MIMETYPE['json'])

def getUsername(request):
	"""根据id获取用户名
	"""
	
	id = request.POST.get('id',None)
	if id is None:
		return FAILRESPONSE
	
	user = User.objects.get(pk=id)
	json =JSONHelper().getJSON(result=MESSAGE.success,username=user.username)
	return HttpResponse(json,mimetype=MIMETYPE['json'])
	
def getCalendarBookAuth(request):
	"""根据book的pk获取所有的共享权限
	"""
	post = simplejson.loads(request.raw_post_data)
	book = CalendarBook.objects.filter(pk__in=post['data'])
	
	auths = CalendarBookAuth.objects.filter(calendarBook__in=book)
	json = JSONHelper.getJSON(result=MESSAGE.success,bookAuths=auths)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

def updateCalendarBookAuth(request):
	user = request.user
	if isUserLogined(user) is not True:
		return FAILRESPONSE
		
	post = simplejson.loads(request.raw_post_data)
	
	updateList = []
	
	print post
	for p in post['data']:
		if p['action'] == 'new':
			print 1.1
			auth = CalendarBookAuth()
			users = User.objects.filter(username=p['username'])
			book = CalendarBook.objects.get(id=p['book'])
			if users.count() == 0 or book is None:
				return FAILRESPONSE
			else:
				auth.calendarBook = book
				auth.user = users[0]
				auth.grantor = user
				
		else:
			auth = CalendarBookAuth.objects.get(pk=p['auth'])
			if auth is None:
				return FAILRESPONSE
		
		print 2
		if p['action'] == 'delete':
			CalendarBookSubscribe.objects.filter(calendarBookAuth=auth).delete()
			auth.delete()
		else:
			if auth.save() == True:
				updateList.append(auth)
			
	json = JSONHelper.getJSON(result=MESSAGE.success,auths=updateList)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

	
def newSubscribe(request):
	user = request.user
	if isUserLogined(user) is not True:
		return FAILRESPONSE
		
	post = simplejson.loads(request.raw_post_data)
	print post
	
	grantor = post.get('username',None)
	bookId = post.get('bookId',None)
	
	resultSub = []
	resultBook = []
	
	if grantor is not None:
		grantor = User.objects.get(username__exact=grantor)
		resultSub = CalendarBookSubscribe.newSubscribe(user,grantor=grantor)
	elif bookId is not None:
		calendarBook = CalendarBook.objects.get(pk=bookId)
		resultSub = CalendarBookSubscribe.newSubscribe(user,books=[calendarBook])
	else:
		return FAILRESPONSE
		
	for sub in resultSub:
		resultBook.append(sub.calendarBook)

	json = JSONHelper.getJSON(result=MESSAGE.success,subscribe=resultSub,book=resultBook)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

def logoutView(request):
	logout(request)
	return redirect('/calendar/login')
	
def deleteSubscribe(request):
	user = request.user
	if isUserLogined(user) is not True:
		return FAILRESPONSE
		
	post = simplejson.loads(request.raw_post_data)
	
	bookId = post.get("pk",None)
	if bookId is not None:
		subscribe = CalendarBookSubscribe.objects.filter(user=user,calendarBook_id=bookId)
		
	if subscribe.count() != 0:
		subscribe.delete()
	
	json = JSONHelper.getJSON(result=MESSAGE.success)
	return HttpResponse(json,mimetype=MIMETYPE['json'])
		
		
def getPublicCalendarBook(request):
	books = CalendarBook.objects.filter(isPublic=True)
	
	json = JSONHelper.getJSON(result=MESSAGE.success,book=books)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

def updateUserSetting(request):
	user = request.user
	userSetting = user.get_profile()
	
	firstDayOfWeek = request.POST.get("first-day-of-week",None)
	
	
	if firstDayOfWeek is not None:
		userSetting.firstDayOfWeek = firstDayOfWeek
		
	userSetting.save()
	
	json = JSONHelper.getJSON(result=MESSAGE.success,userSetting=userSetting)
	return HttpResponse(json,mimetype=MIMETYPE['json'])

@login_required
def getUserSetting(request):
	user = request.user
	userSetting = user.get_profile()
	json = JSONHelper.getJSON(result=MESSAGE.success,userSetting=userSetting)
	return HttpResponse(json,mimetype=MIMETYPE['json'])
	
@login_required
def getCalendarBookView(request):
	user = request.user
	
	books = []
	subscribe = []
	#获取用户自身的日历本
	calendarBooks = user.calendarbook_set.all() \
							.order_by('-isDefault','-createDateTime')
							
	subscribeBooks = CalendarBookSubscribe.objects.filter(user=user)
	for sub in subscribeBooks:
		books.append(sub.calendarBook)
		subscribe.append(sub)
	
	books += list(calendarBooks)
	
	json = JSONHelper.getJSON(result=MESSAGE.success,calendarBook=books,subscribe=subscribe)
	return HttpResponse(json,mimetype=MIMETYPE['json'])
	
	
@login_required
def globalSearch(request):
	print 'global search function'
	
	content = request.POST['content']
	
	acts = Activity.objects.filter(content__contains=content)
	
	json = JSONHelper.getJSON(result=MESSAGE.success,activity=acts)
	return HttpResponse(json,mimetype=MIMETYPE['json'])
