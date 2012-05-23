var timeArray = ["00:00","00:30","01:00","01:30",
				"02:00","02:30","03:00","03:30",
				"04:00","04:30","05:00","05:30",
				"06:00","06:30","07:00","07:30",
				"08:00","08:30","09:00","09:30",
				"10:00","10:30","11:00","11:30",
				"12:00","12:30","13:00","13:30",
				"14:00","14:30","15:00","15:30",
				"16:00","16:30","17:00","17:30",
				"18:00","18:30","19:00","19:30",
				"20:00","20:30","21:00","21:30",
				"22:00","22:30","23:00","23:30"]




Calendar.modal = {};
Calendar.activityDetail = {};
Calendar._lastMouseWheelDate = null;
Calendar._mouseWheelInterval = 600;
Calendar._monthDate = {};	//缓存日历数组
Calendar._$template = $(".calendar-template"); 
Calendar._weekDays = ["周天","周一","周二","周三","周四","周五","周六"];

var ajaxSubmitResult ;
var activitySubmitOption = {
	async:false,
	success:function(message){
		ajaxSubmitResult = message;
		if(message["result"] == SUCCESS){
			var info,infoTitle = '成功';
			if(message['action'] == 'add')
				info = '创建了一个新活动';
			else if(message['action'] == 'delete')
				info = '删除了一个活动';
			else if(message['action'] == 'update')
				info = '更新了一个活动';
			showTitleInfo(2,info,infoTitle);
			if(!isUndefined(this.calendar)){
				this.calendar.refreshActivity(message["activity"],message["action"],message['repeat']);
			}
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
/*****************************************************
*全局初始化
*****************************************************/
Calendar.init = function(){
	Calendar.$t_templateDiv = $("#calendar-template");
	Calendar.$t_dMonthRow = Calendar.$t_templateDiv.children(".d-month-row:first");
	Calendar.$t_trRowEvent = Calendar.$t_templateDiv.find(".tr-event-row");
	Calendar.$t_trEventBroswer = Calendar.$t_templateDiv.find(".tr-event-broswer");
	Calendar.nowId = 0;
}

/*****************************************************
*构造函数
*****************************************************/
function Calendar($calendar,today,requiredInfo){
	this._today = new TimeZoneDate(today);
	this._$calendarDiv = $calendar;
	this._$dMonthBody = this._$calendarDiv.find(".d-month-body:first");
	this._calendarDate = this._today.clone();
	this._activity = [];
	this._activitySubmitOption = $.extend({calendar:this},activitySubmitOption)
	this._activityCache = [];
	this._monthHash = {};
	this._dMonthRowCanMore = {};
	this._requiredInfo = requiredInfo;
	this._calendarBook = requiredInfo.book.concat(requiredInfo.subscribe);
	this._filterOption = [];
	this._activityCacheList = {};
	this._repeat = [];
	this._activityToShow = {};
	

	Calendar._monthDate = {};	//缓存日历数组
	
	Calendar.firstDayOfWeek = requiredInfo.userSetting.fields.firstDayOfWeek;
	if(Calendar.firstDayOfWeek == '0')
		Calendar._weekDays = ["周天","周一","周二","周三","周四","周五","周六"];
	else if(Calendar.firstDayOfWeek == '1')
		Calendar._weekDays = ["周一","周二","周三","周四","周五","周六","周天"];	
		
	this.initCalendar();
	
	Calendar.dealWithMenuBarEvent(this);
	Calendar.dealWithMonth(this);
	Calendar.dealWithAction(this);
	
	this.showMonth();
	this.refreshActivity();
	return this;
}
Calendar.prototype.initCalendar = function(){
	var $weekDays = this._$calendarDiv.find(".d-month-head td");
	for(var i=0;i<7;i++){
		$weekDays.eq(i).html(Calendar._weekDays[i]);
	}
}

Calendar.prototype.refresh = function(requiredInfo){
	Calendar._monthDate = {};	//缓存日历数组
	
	Calendar.firstDayOfWeek = requiredInfo.userSetting.fields.firstDayOfWeek;
	if(Calendar.firstDayOfWeek == '0')
		Calendar._weekDays = ["周天","周一","周二","周三","周四","周五","周六"];
	else if(Calendar.firstDayOfWeek == '1')
		Calendar._weekDays = ["周一","周二","周三","周四","周五","周六","周天"];
	
	this._calendarDate = this._today.clone();
	this._activity = [];
	this._activitySubmitOption = $.extend({calendar:this},activitySubmitOption)
	this._activityCache = [];
	this._monthHash = {};
	this._dMonthRowCanMore = {};
	this._requiredInfo = requiredInfo;
	this._calendarBook = requiredInfo.book.concat(requiredInfo.subscribe);
	this._filterOption = [];
	this._activityCacheList = {};
	this._repeat = [];
	this._activityToShow = {};

	this.initCalendar();
	this.showMonth();
	this.refreshActivity();
	return this;
}
/*****************************************************
*刷新日历本
*****************************************************/
Calendar.prototype.refreshCalendarBook = function(gRequiredInfo){
	this._calendarBook = gRequiredInfo.book.concat(gRequiredInfo.subscribe);
	this._activityCacheList = {};
	this._activityCache = [];
	this.refreshActivity();
}
/*****************************************************
*设置每一个日历对象的事件响应
*****************************************************/
Calendar.dealWithMenuBarEvent = function(calendar){
	calendar._$calendarDiv.find(".btn-today").click(function(){
		calendar.showMonth();
		
		showModal($("#calendar-activity-broswer"));
	});
	
	calendar._$calendarDiv.find(".btn-next-month").click(function(){
		calendar.showMonth(calendar._calendarDate.addMonths(1));
	});
	
	calendar._$calendarDiv.find(".btn-last-month").click(function(){
		calendar.showMonth(calendar._calendarDate.addMonths(-1));
	});
}


Calendar.dealWithAction = function(calendar){
	//创建新活动窗口的提交事件
	$("#simple-add-modal .simple-submit").click(function(){
		$("#simple-add-modal").find("form").ajaxSubmit(calendar._activitySubmitOption);
	});
	
	$("#simple-edit-modal #simple-update").click(function(){
		$("#simple-edit-modal").find("form:first").ajaxSubmit(calendar._activitySubmitOption);
	});
	
	$(".edit-detail").click(function(){
		Calendar.activityDetail.showEditDetail(calendar,$(this).closest(".modal").find("form:first"));
	});
	
	$("#calendar-activity-detail").find("#activity-detail-submit").click(function(){
		Calendar.activityDetail.submit(calendar);
	});
	
	calendar._$calendarDiv.find("#calendar-activity-detail").find("#activity-detail-cancel").click(function(){
		calendar.switchToMonth();
	});
	
	calendar._$calendarDiv.find("div.activity-form-container").find(".activity-detail").click(function(){
		$form = $(this).closest(".activity-form-container").find("form:first");
		$form.find("[name=action]").val("delete");
		$form.ajaxSubmit(calendar._activitySubmitOption);
	});
}


/*****************************************************
*刷新活动
*****************************************************/
Calendar.prototype.refreshActivity = function(act,action,repeat){

	var monthId = this._calendarDate.getMonthId();
	//查看是否有缓存存在
	if(!(monthId in this._activityCacheList)){
			this.getActivity();
	}
	
	
	this._canMoreMonthRow = true;
	this._dMonthRowCanMore = {};
	if(!isUndefined(act)){
		this.cacheActivity(act,action);
	}
	if(!isUndefined(repeat)){
		this.cacheRepeat(repeat,action);
	}

	this.showActivity();
	this.mergeEventColumn();
}

/*****************************************************
*清除已有事件及日历
*****************************************************/
Calendar.prototype.clearMonth = function(){
	var $monthBody = $(this._$calendarDiv).find(".d-month-body");
	$monthBody.html("");
}



/*****************************************************
*排序一个活动数组
*****************************************************/
function sortActivity(arr){
	arr.sort(function(act1,act2){
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


/*****************************************************
*缓存活动，减少服务器交互
*****************************************************/
Calendar.prototype.cacheActivity = function(acts,action){
	if(!isUndefined(acts) && !(acts instanceof Array))
		acts = [acts];
	
	for(var i=0;i<acts.length;i++){
		var newAct = acts[i];
		findAndUpdateObject(this._activityCache,"pk",newAct.pk,newAct,action);
	}

	
	sortActivity(this._activityCache);
}

Calendar.prototype.switchToMonth = function(){
	switchContainer($("#calendar-activity-detail"),this._$calendarDiv.children(".calendar:first"));
}






