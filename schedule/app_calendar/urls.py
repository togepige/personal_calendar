from django.conf.urls.defaults import patterns, include, url
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
urlpatterns = patterns('schedule.app_calendar.views',
    # Examples:
    # url(r'^$', 'Plan_your_life.views.home', name='home'),
    # url(r'^Plan_your_life/', include('Plan_your_life.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^$', 'base'),
	url(r'^login/$','loginView'),
	url(r'^register/$','register'),
	url(r'^auth','auth'),
	url(r'^reg$','reg'),
	url(r'^get/activity','getActivity'),
	url(r'^get/repeat/activity','getRepeatActivity'),
	url(r'^get/requiredinfo','getRequiredInfo'),
	url(r'^update/activity/detail','updateActivityDetail'),
	url(r'^update/calendarbook$','updateCalendarBook'),
	url(r'^get/calendarbook$','getCalendarBook'),
	url(r'^get/calendarbook/auth','getCalendarBookAuth'),
	url(r'^update/calendarbook/auth','updateCalendarBookAuth'),
	url(r'^get/username','getUsername'),
	url(r'^new/subscribe','newSubscribe'),
	url(r'^delete/subscribe','deleteSubscribe'),
	url(r'^logout','logoutView'),
	url(r'^get/publicbook','getPublicCalendarBook'),
	url(r'^get/user-setting','getUserSetting'),
	url(r'^get/calendar-book','getCalendarBookView'),
	url(r'^update/user-setting','updateUserSetting'),
	url(r'^search/all','globalSearch'),
)

