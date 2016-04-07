# personal_calendar

## Overview
This website is inspired by Google's exit from China. I want user to have a better system to manage their calendar so I design and develop this website. However, after I began my last year of undergraduate study, I found that only little time left for me to continue this project. Thus, I have only finished parts of my design but it still one of my favorite projects because it is basically the first website I developed and I really learned a lot from it.

## Highlight
* Designed and developed by myself
* Allow user to manage their calendar
* User can set repeat type of event based on day, week, year and repeat times
* User can have multiple calendar book and also subscribe public calendar such like holiday
* User can set different timezone for each calendar book
* Allow user to search calendar quickly
* Provide various of settings to user such like the privacy and share of calendar book, first day of week, etc..

## Note:
This project is use Django 1.4.0 but now the the latest Django version is about 1.9.5. I may update the django version in future but not now.

You also post some screenshots under screenshot folder, you can check it.

## Requirements
Django 1.4.0

## Installation
1. Use "pip install -r requirements.txt" to install dependencies. Using virtualenv is recommended because that won't mess up your python environment.
2. Use "python manage.py syncdb" to create table in your local database(you may need to create schedule database schema first)
3. Use "python manage.py runserver" to test in your local test server

## Other Information
If you need to deploy it on other app engine or apache, please use WSGI and you may need to refer to some other documents for deployment.
