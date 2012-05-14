#coding:utf-8
"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""
from django.utils import simplejson as json
from django.test import TestCase
from schedule.app_calendar.tools import *
from datetime import date
from schedule.app_calendar.models import *
from django.contrib.auth.models import User
from schedule.app_calendar.views import *
from schedule.app_calendar.message import *
from django.core.serializers import serialize,deserialize
# from schedule.app_calendar.tools import *
from django.test.client import Client

from datetime import *
from dateutil import *
from dateutil.tz import *
from dateutil.parser import *
import pytz
class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)

class ToolsTest(TestCase):
	def testGetDateFromString(self):
		dateString = '20120102'
		d = date(2012,1,2)
		self.assertEqual(getDateFromString(dateString),d)
		
	
class DatabaseTest(TestCase):
	jsonString = ""
	def setUp(self):
		ac = []
		user = User.objects.create_user('testuser','testuser','1234')
		user.save()
		
		book1 = CalendarBook(name='默认',user=user,isDefault=True,calendarModelType='A')
		book1.save()
		book2 = CalendarBook(name='1',user=user,isDefault=False,calendarModelType='A')
		book2.save()
		
		ac.append(Activity(calendarBook=book1,content='activity1'))
		ac.append(Activity(calendarBook=book1,content='activity2'))
		ac.append(Activity(calendarBook=book1,content='activity3'))
		ac.append(Activity(calendarBook=book2,content='activity4'))
		ac.append(Activity(calendarBook=book2,content='activity5'))
		for a in ac:
			a.save()
		
	def testActivity(self):
		acs = Activity.objects.all()
		count = Activity.objects.all().count()
		self.assertEqual(count,5)
		
	def testGetJson(self):
		d = date.today()
		user = User.objects.all()[0]
		calendarBooks = getCalendarBook(user,'A')
		activities = {}
		if user is not None and user.is_authenticated():
			calendarBooks = getCalendarBook(user,ACTIIVITYMODEL)
			for book in calendarBooks:
				activities[str(book.id)] = (book.activity_set.all())
		
		result = getJson(result="success",book = calendarBooks,activity = activities)
		# self.jsonString = result
		print result
		
		# for ob in jsonBack(result):
			# print ob.object.id

		

		
class TestActivity(TestCase):
	def testGetAll(self):
		c = Client()
		response = c.post('calendar/getactivity',{'data':'20120407'})
		assertEqual(response.status_code,200)
		print response.content

class JsonTest(TestCase):

	def testGetJson(self):
		""" 测试函数
		"""
		user = User.objects.create_user('testuser','testuser','1234')
		#指定了cls这个不定参数，指明要使用的规则
		print json.dumps(user,cls=self.TestEncoder)
		
class TimezoneTest(TestCase):
	def test1(self):
		shanghai = pytz.timezone('Asia/Shanghai')
		now = datetime.now(shanghai)
		abbrev=now.strftime('%Z')
		offset=now.strftime('%z')
		print abbrev + offset
	
	def test2(self):
		print parse('2012-04-10T16:00:00.000Z')
		
class UserValidatorTest(TestCase):
	def setUp(self):
		self.message = MessageBase()
		self.user = User.objects.create_user('testuser@test.com','testuser@test.com','1234')
	def testUsername(self):
		self.assertEqual(UserValidator.usernameValidate('123'),self.message.tooShort)
		self.assertEqual(UserValidator.usernameValidate('12334'),self.message.notEmail)
		self.assertEqual(UserValidator.usernameValidate('12334@qq.com'),self.message.userNotExist)
		self.assertEqual(UserValidator.usernameValidate('12334@qq.com',True),self.message.success)
		self.assertEqual(UserValidator.usernameValidate('testuser@test.com'),self.message.success)
		self.assertEqual(UserValidator.usernameValidate('testuser@test.com',True),self.message.userExist)
		
	def testPassword(self):
		self.assertEqual(UserValidator.passwordValidate('123'),self.message.tooShort)
		self.assertEqual(UserValidator.passwordValidate('12345','12345'),self.message.success)
		self.assertEqual(UserValidator.passwordValidate('1235','1234'),self.message.passwordNotEqual)
		
		
class QTest(TestCase):
	pass

		
