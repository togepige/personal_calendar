//新版Calendar js
var Calendar = {};
Calendar.func = {};
Calendar.event = {};

Calendar.view = {};
Calendar.nowId = 0;
Calendar.userSetting = {};
Calendar.calendarBook = {};
Calendar.monthDateArray = {};
Calendar.calendarBook.func = {};
Calendar.activity = {};
Calendar.activity.cacheList = [];
Calendar.activity.func = {};
Calendar.subscribe = {};
Calendar.models = {};
Calendar.models.repeat = [];
Calendar.models.activity = [];
Calendar.models.user = {};


Calendar.activity.submitOption = {
	async:false,
	success:function(message){
		if(message["result"] == SUCCESS){
			var info,infoTitle = '成功';
			if(message['action'] == 'new')
				info = '创建了一个新活动';
			else if(message['action'] == 'delete')
				info = '删除了一个活动';
			else if(message['action'] == 'update')
				info = '更新了一个活动';
			showTitleInfo(2,info,infoTitle);
			
			Calendar.models.activity = Objects.func.update(Calendar.models.activity,message['activity'],"pk",message['action']);
			Calendar.models.repeat = Objects.func.update(Calendar.models.repeat,message['repeat'],"pk",message['action']);
			Calendar.activity.func.sortActivity();
			if(typeof(this.afterSuccess) == 'function'){
				this.afterSuccess();
			}
		}
		else{
			showTitleInfo(-1,'操作失败，请重试','错误');
		}
	},
	error:function(){
		showTitleInfo(-1,'操作失败，请重试','错误');
	},
};

$(document).ready(function(){
	Calendar.func.getRequiredInfo();
	Calendar.func.getUserSetting();
	Calendar.func.getCalendarBook();
	
	
	for(var e in Calendar.event){
		Calendar.event[e]();
	}
	
	Calendar.func.setLeftNav();
	
	Calendar.view.init();
	
	Calendar.view.month.func.refresh();
});

/*****************************************************
*从服务器获取必要信息，例如当前时间，用户信息等
*****************************************************/
Calendar.func.getRequiredInfo = function(){
	var result = true;
	var data;
	$.ajax({url:"/calendar/get/requiredinfo",
			type:"post",
			async:false,
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else
					data = d;
			},
			error:function(){
				result = false;
			}
		
		});
	//如果获取成功则存储信息至全局变量
	if(result == false){
		showTitleInfo(-1,'获取用户信息失败','错误');
	}else{
		Calendar.today = new TimeZoneDate(data['today']);
		Calendar.models.user = data['user'];
		Calendar.models.tzOffset = data['tzOffset'];
		TimeZoneDate.initTimeZoneOffset(Calendar.models.tzOffset);
	}
}
/*****************************************************
*获取用户的配置信息
*****************************************************/
Calendar.func.getUserSetting = function(){
	var result = true;
	var data;
	$.ajax({url:"/calendar/get/user-setting",
			type:"post",
			async:false,
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else
					data = d;
			},
			error:function(){
				result = false;
			}
		
		});
	if(result == true)
		Calendar.models.userSetting = data['userSetting'];
	else if(result == false)
		showTitleInfo(-1,'获取用户信息失败','错误');
}
/*****************************************************
*获取日历本
*****************************************************/
Calendar.func.getCalendarBook = function(){
	var result = true;
	var data;
	$.ajax({url:"/calendar/get/calendar-book",
			type:"post",
			async:false,
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else
					data = d;
			},
			error:function(){
				result = false;
			}
		
		});
	if(result == true){
		Calendar.models.calendarBook = data['calendarBook'];
		Calendar.models.subscribe = data['subscribe'];
	}
	else if(result == false)
		showTitleInfo(-1,'获取用户信息失败','错误');
}

/*****************************************************
*设置边栏导航相关
*****************************************************/
Calendar.func.setLeftNav = function(){
	
	var books = Calendar.models.calendarBook;
	var $bookTemplate = $("#nav-my-book").children(".book:first");
	$("#nav-my-book").children(".book").detach();
	$("#nav-subscribe").children(".book").detach();

	for(var i=0;i<books.length;i++){
		var $book = $bookTemplate.clone();
		$book.attr("calendar-book",books[i].pk);
		$book.find(".book-name").html(books[i].fields.name.sub(12));
		$book.find(".book-icon").addClass("icon-ok-sign");
		
		if(Calendar.calendarBook.func.isSubscribe(books[i].pk) == null)
			$("#nav-my-book").append($book);
		else
			$("#nav-subscribe").append($book);
	}
	
}
/*****************************************************
*计算每个月所要显示日期的函数
*****************************************************/
Calendar.func.getMonthDateArray = function(date){
	date = new TimeZoneDate(date);
	var monthId = date.getMonthId();
	
	//查看缓存数据
	if(!isUndefined(Calendar.monthDateArray[monthId]))
		return Calendar.monthDateArray[monthId];
	
	var dateArray = new Array();
	var firstDate = date.moveToFirstDayOfMonth();
	var firstDay = firstDate.getDay();//获得当月的第一天为星期几

	var i,j;
	var minusNum = 0;	//需要减去的天数
	var dateN;	//用于暂存计算出来的日期
	var maxDay;
	
	//根据用户配置信息中所配置的第一天为周几来设置日期数组
	if(Calendar.models.userSetting.fields.firstDayOfWeek == 1)
		firstDay = (firstDay - 1) == -1 ? 6 : (firstDay - 1);
	
	//首先计算当月之前的日期
	for(i = 0; i<firstDay; i++){
		minusNum = i - firstDay ;
		dateN = firstDate.clone().addDays(minusNum);
		dateArray[i] = dateN;
	}
	
	//计算当月的日期
	dateN = firstDate.clone();
	for(;;i++){
		dateArray[i] = dateN;
		// dateN = addDays(dateN,1);		//继续计算下一天
		dateN = dateN.clone().addDays(1);
		if(dateN.getMonth() != date.getMonth()){
			i++;
			break;
		}
	}
	
	//判断日历显示需要5行或者6行
	maxDay = i > 35 ? 42 : 35; 
	//计算当月之后的日期
	for(;i<maxDay;i++){
		dateArray[i] = dateN;
		// dateN = addDays(dateN,1);
		dateN = dateN.clone().addDays(1);
	}
	
	//记录并返回设置好的日期数组
	Calendar.monthDateArray[monthId] = dateArray;
	return dateArray;
}
/*****************************************************
*初始化边栏事件
*****************************************************/
Calendar.event.initLeftNavEvent = function(){
	var $sideBarNav = $("#sidebar-nav");
	
	$sideBarNav.on('click',".book",function(){
			var $book = $(this);
			var filter = {field:"fields.calendarBook",type:"ne",val:$(this).attr("calendar-book")};
			if($book.hasClass("disable")){
				Calendar.view.func.removeFilter(filter);
				$book.removeClass("disable");
				$book.find(".book-name").removeClass("gray");
				$book.find(".book-icon:first").addClass("icon-ok-sign");
				$book.find(".book-icon:first").removeClass("icon-remove");
			}else{
				Calendar.view.func.addFilter(filter);
				$book.addClass("disable");
				$book.find(".book-name").addClass("gray");
				$book.find(".book-icon:first").removeClass("icon-ok-sign");
				$book.find(".book-icon:first").addClass("icon-remove");
			}
			Calendar.view.month.func.refresh();
		}
	);
}
/*****************************************************
*顶栏事件
*****************************************************/
Calendar.event.initHeaderBarEvent = function(){
	$("#to-user-setting").click(function(){
		toContainer($("#user-setting"),function(){
			$("#user-setting-tab-nav a:first").tab('show');
		});
	});
	
	$("#to-calendar").click(function(){
		toContainer($("#calendar-main"));
	});
}
/*****************************************************
*日历本的类型获取
*****************************************************/
Calendar.calendarBook.func.isSubscribe = function(book){
	if(typeof(book) == 'object')
		book = book.pk;
		
	var subscribe = getObjectInArray(Calendar.models.subscribe,"fields.calendarBook",book);
	if(subscribe == null)
		return null;
		
	return subscribe;
}

/*****************************************************
*活动的获取
*****************************************************/
Calendar.activity.func.getActivity = function(d){
	if(Calendar.activity.cacheList[d] == true)
		return;
	var dates = [];
	var dateArray = Calendar.func.getMonthDateArray(d);
	var beginDate = dateArray[0];
	var endDate = dateArray[dateArray.length - 1];
	
	dates.push(beginDate.toISOString());
	dates.push(endDate.toISOString());
	if(dates.length != 0){
		$.ajax({url:"/calendar/get/activity/",
				data:JSON.stringify({"date":dates}),
				type:"post",
				async:false,
				success:function(data){
					Objects.func.update(Calendar.models.activity,data['activity'],"pk",'update');
					Objects.func.update(Calendar.models.repeat,data['repeat'],"pk","update");
					Calendar.activity.cacheList[d] = true;
					Calendar.activity.func.sortActivity();
				},
			});
	}else{
		return false;
	}
}

/*****************************************************
*获取两个日期间隔范围的交际
*****************************************************/
Calendar.func.getDateBetween = function(begin,end,limitBegin,limitEnd){
	if(!(begin.validate() && end.validate())) return null;

	result = [];
	if(TimeZoneDate.compare(begin,limitEnd) > 0) return null;
	if(TimeZoneDate.compare(end,limitBegin) < 0) return null;
	
	if(TimeZoneDate.compare(begin,limitBegin)<0)
		result[0] = limitBegin.clone();
	else
		result[0] = begin.clone()
		
	if(TimeZoneDate.compare(end,limitEnd) < 0)
		result[1] = end.clone();
	else
		result[1] = limitEnd.clone()
	
	return result;
}

Calendar.func.getId = function(){
	return "calendar-" + Calendar.nowId++;
}


Calendar.activity.func.getActivityByDate  = function(beginDate,endDate){
	var acts = [];
	for(var i=0;i<Calendar.models.activity.length;i++){
		var act = Calendar.models.activity[i];
		var actBegin = new TimeZoneDate(Objects.func.getObjectField(act,"fields.beginDateTime"));
		var actEnd = new TimeZoneDate(Objects.func.getObjectField(act,'fields.endDateTime')).clearTime();
		var result = false;;
		if(isUndefined(endDate)){
			if(TimeZoneDate.compare(actBegin,beginDate) == 0 )
				result = true;
		}
		else{
			var r1 = actBegin.between(beginDate,endDate);
			var r2 = actEnd.between(beginDate,endDate);
			if(r1 || r2)
				result = true;
		}
		
		if(result == true)
			acts.push(act);
	}
	return acts;
}

Calendar.activity.func.submit = function($form,action){
	$form.ajaxSubmit(Calendar.activity.submitOption);
	Calendar.view.month.func.refresh();
}

/*****************************************************
*排序一个活动数组
*****************************************************/
Calendar.activity.func.sortActivity = function(){
	Calendar.models.activity.sort(function(act1,act2){
		var result1 = TimeZoneDate.compare(act1.fields.beginDateTime,act2.fields.beginDateTime);
		var result2 = TimeZoneDate.dayBetween(act1.fields.beginDateTime,act1.fields.endDateTime);
		var result3 = TimeZoneDate.dayBetween(act2.fields.beginDateTime,act2.fields.endDateTime);
		
		if (result1 != 0) 
			return result1;
		else if(result2 > result3){
			return -1;
		}
		else if(result2 < result3){
			return 1;
		}
		else if(act1.fields.isWholeDay == false){
			return -1;
		}
		else if(act2.fields.isWholeDay == false){
			return 1;
		}
		else{
			return (act1.pk - act2.pk)
		}
	});
}

Calendar.func.onCalendarBookChange = function(){
	Calendar.func.setLeftNav();
	Calendar.view.func.refresh();
}

/*****************************************************
*根据用户ID获取用户名
*****************************************************/
Calendar.func.getUsernameById = function(id){
	id = id + "";

	//查看缓存
	if(isUndefined(Calendar.models.user[id]) == false)
		return Calendar.models.user[id]
	//从服务器获取用户名
	
	$.ajax({url:"/calendar/get/username",
		type:"post",
		async:false,
		data:{id:id},
		success:function(d){
			if(d['result'] == SUCCESS)
				Calendar.models.user[id] = d['username']
		},
		error:function(){
		}
	});
	return Calendar.models.user[id];
}

Calendar.activity.func.deleteFromCalendarBook = function(books){
	Objects.func.update(Calendar.models.activity,books,null,'delete',function(obj1,obj2){
		var bookId = Objects.func.getObjectField(obj2,"pk");
		if(obj1.fields.calendarBook == bookId)
			return 0;
		return 1;
	});
}

Calendar.activity.func.invalidateCache = function(){
	Calendar.activity.cacheList = [];
	Calendar.models.activity = [];
}


Calendar.activity.func.canEdit = function(act){
	var book = Objects.func.getObjectInArray(Calendar.models.calendarBook,"pk",act.fields.calendarBook);
	if(book == null )
		return false;
	
	var sub = Objects.func.getObjectInArray(Calendar.models.subscribe,"fields.calendarBook",book.pk);
	if(sub == null)
		return true;
	else{
		return false;
	}
	
	return false;
}

