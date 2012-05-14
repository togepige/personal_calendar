from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()


urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'schedule.views.home', name='home'),
    # url(r'^schedule/', include('schedule.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
	url(r'^admin/doc/',include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
	
	url(r'^calendar/',include('schedule.app_calendar.urls')),

)
from django.conf import settings
from django.conf.urls.static import static
# urlpatterns += static(settings.STATIC_URL,document_root=settings.STATIC_ROOT)
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()
