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
		ajaxSubmitResult = null;
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
/*****************************************************
*月视图界面互动的相关事件注册
*****************************************************/
Calendar.dealWithMonth = function(calendar){
	//简单的添加窗口显示
	calendar._$calendarDiv.on('click',".td-day-grid-bg,.td-day-grid-title,.td-event.empty",function(){
		var $modal = $("#simple-add-modal");
		var $form = $modal.find("form:first");
		var beginDateTime = new TimeZoneDate($(this).attr("date-id"));
		showModal($modal,$(this));
		focusOnFirst($modal);
		clearForm($modal);
		$form.find("[name=begin-datetime]").val(beginDateTime.toString());
		$form.find(".clicked-date").html(moment(beginDateTime).format("LL"));
	});
	
	calendar._$calendarDiv.on('click',' .calendar>.d-month>.d-month-body>.d-month-row .td-event[activity]',function(){
		var pk = $(this).attr("activity");
		var act = getObjectInArray(calendar._activityCache,"pk",pk);
		Calendar.modal.showSimpleEdit(calendar,act);
	});
	
	//月视图上的鼠标滚轮事件响应
	calendar._$calendarDiv.find(".d-month-body").on('mousewheel',function(event,delta){
		if(Calendar._lastMouseWheelDate == null) {
			Calendar._lastMouseWheelDate = new Date();
			calendar.moveMonth(-delta);
			return false;
		}
		var tempDate = new Date();
		var interval = tempDate.getTime() - Calendar._lastMouseWheelDate.getTime();
		if(interval < Calendar._mouseWheelInterval) return false;
		Calendar._lastMouseWheelDate = tempDate;
		calendar.moveMonth(-delta);
		return false;
	});
	//时间选择的相关事件设置
	calendar._$calendarDiv.find("#calendar-activity-detail").find(".time").autocomplete({
		source:timeArray,
		minLength:0,
		delay:100,
	});
	calendar._$calendarDiv.find("#calendar-activity-detail").find(".time").click(function(){
		$(this).autocomplete("search","");
	});	
	
	//点击查看更多事件时的响应
	calendar._$dMonthBody.on("click"," .t-month-row-event tr.more-activity>td.more-activity",function(){
		Calendar.modal.showActivityBroswer(calendar,new TimeZoneDate($(this).attr("date-id")));
	});
	
	calendar._$calendarDiv.find('.activity-broswer').on('click',' .td-event',function(){
		var pk = $(this).attr("activity");
		var act = getObjectInArray(calendar._activityCache,"pk",pk);
		Calendar.modal._$activityBroswer.modal("hide");
		Calendar.modal.showSimpleEdit(calendar,act);
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
*计算每个月所要显示日期的函数
*****************************************************/
Calendar.getMonthDateArray = function(date){
	if(!(date instanceof TimeZoneDate)){
		date = new TimeZoneDate(date);
		if(!(date instanceof TimeZoneDate))
			return null;
	}

	var monthId = date.getMonthId();
	//查看缓存数据
	if(!isUndefined(this._monthDate[monthId]))
		return this._monthDate[monthId];
	
	var dateArray = new Array();
	var firstDate = date.moveToFirstDayOfMonth();
	var firstDay = firstDate.getDay();//获得当月的第一天为星期几

	var i,j;
	var minusNum = 0;	//需要减去的天数
	var dateN;	//用于暂存计算出来的日期
	var maxDay;
	
	//根据用户配置信息中所配置的第一天为周几来设置日期数组
	if(Calendar.firstDayOfWeek == 1)
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
	this._monthDate[monthId] = dateArray;
	return dateArray;
}
/*****************************************************
*monthId 格式:2010-01-02
*****************************************************/
Calendar.prototype.showMonth = function(date){
	if(isUndefined(date)){
		date = this._today;
	}
	this._calendarDate = new TimeZoneDate(date);

	var monthId = this._calendarDate.getMonthId();

	var dateArray = Calendar.getMonthDateArray(monthId);
	var rowCount = dateArray.length / 7;
	
	var rowHeightPercent = 1 / rowCount;
	var rowHeight = toPercent(rowHeightPercent);
	
	//设置日历行数
	if(rowCount == 5)
		this._$dMonthBody.children(".d-month-row:eq(5)").detach();
	else
		this._$dMonthBody.append(Calendar.$t_dMonthRow.clone());
	
	//首先清除已有样式
	// this.clearMonth();
	//设置每行的位置和高度
	var $dMonthRows = this._$dMonthBody.children(".d-month-row");
	
	for(var i=0;i<rowCount;i++){
		var $monthRow = $dMonthRows.eq(i);
		
		$monthRow.attr("id",Calendar.getId());
		//清除行下的事件
		var $monthRowEvent = $monthRow.children(".t-month-row-event");
		$monthRowEvent.find(".t-month-row-event").detach();
		//设置位置和高度
		var rowPosition = toPercent(rowHeightPercent * i);
		$monthRow.height(rowHeight);
		$monthRow.css("top",rowPosition);
		//设置行下每个单元格的日期和属性
		var $allBg = $monthRow.children(".t-month-row-base").find("td.td-day-grid-bg");
		var $allTitle = $monthRowEvent.find("td.td-day-grid-title");
		for(j=0;j<7;j++){
			var count = i * 7 + j;
			var $dayGridTitle = $allTitle.eq(j);
			var $dayGridBg = $allBg.eq(j);
			
			$dayGridTitle.attr("id","calendar-month-td-bg-" + dateArray[count].getDateId());
			$dayGridTitle.attr("date-id",dateArray[count].getDateId());
			$dayGridTitle.children(".d-day-grid-title-number:first")
			.html(dateArray[count].getDate());
			
			$dayGridBg.attr("id","calendar-month-td-bg-" + dateArray[count].getDateId());
			$dayGridBg.attr("date-id",dateArray[count].getDateId());
			
			if(dateArray[count].getMonth() != this._calendarDate.getMonth()){
				
				$dayGridTitle.addClass("gray");
			}else{
				$dayGridTitle.removeClass("gray");
			}
			//设置所归属的日历行的起始终止日期
			if(j == 0)
				$monthRow.attr("begin-date",dateArray[count].getDateId());
			if(j == 6)
				$monthRow.attr("end-date",dateArray[count].getDateId());
			//设置今天格子
			if(dateArray[count].getMonth() == this._today.getMonth()
				&& dateArray[count].getYear() == this._today.getYear()
				&& dateArray[count].getDate() == this._today.getDate()){
				$dayGridBg.addClass("today");
			}else{
				$dayGridBg.removeClass("today");
			}
		}
	}
	this.setMonthHeaderBar();
	this._$monthRows = $dMonthRows;
	this._trHeight = $dMonthRows.find(".t-month-row-event:first tr:first").height();
	this._limitHeight = $dMonthRows.find(".t-month-row-base:first").height();
	//显示活动
	this.refreshActivity();
}

/*****************************************************
*设置月视图的抬头信息
*****************************************************/
Calendar.prototype.setMonthHeaderBar = function(){
		//将当前显示日期赋给所要显示的当前月份的label
	this._$calendarDiv.find(".t-now-month").html(
		moment(this._calendarDate).format("L")
	);
}
/*****************************************************
*前后移动月份
*****************************************************/
Calendar.prototype.moveMonth = function(delta){
	this._calendarDate.addMonths(delta);
	this.showMonth(this._calendarDate);
}
/*****************************************************
*显示活动
*****************************************************/
Calendar.prototype.showActivity = function(){
	var monthId = this._calendarDate.getMonthId();
	var $monthBody = this._$calendarDiv.find(".d-month-body");
	$monthBody.find(".tr-event-row").remove();
	var dateArray = Calendar.getMonthDateArray(monthId);
	var limitBegin = dateArray[0];
	var limitEnd = dateArray[dateArray.length-1];
	
	var dealObjects = [];
	for(var i=0;i<this._activityCache.length;i++){
		act = this._activityCache[i];
		if(isObjectShouldBeFilter(act,this._filterOption) == true) continue;
		dealObjects = dealObjects.concat(this.getDealObject(act,limitBegin,limitEnd));
	}
	//排序
	dealObjects.sort(function(a,b){
		if(a.beginDate.isBefore(b.beginDate))
			return -1;
		else if(a.beginDate.isAfter(b.beginDate))
			return 1;
		return 0;
	});
	
	for(j=0;j<dealObjects.length;j++)
		this.activityToCalendar(dealObjects[j]);
}
/*****************************************************
*
*****************************************************/
Calendar.prototype.activityToCalendar = function(dealObject){
	var genId = Calendar.getId();
	var moreString1 = "更多的";
	var moreString2 = "个活动";
	var beginDateToDeal = dealObject.beginDate;
	var endDateToDeal = dealObject.endDate;
	
	var beginDateTime = new TimeZoneDate(dealObject.activity.fields.beginDateTime);
	var endDateTime = new TimeZoneDate(dealObject.activity.fields.endDateTime);
	var isDurative = false;
	if(TimeZoneDate.dayBetween(dealObject.activity.fields.beginDateTime,dealObject.activity.fields.endDateTime) != 0){
		isDurative = true;
	}
	
	var activity = dealObject.activity;

	var dayCountToDeal = TimeZoneDate.dayBetween(beginDateToDeal,endDateToDeal);
	while(TimeZoneDate.compare(beginDateToDeal,endDateToDeal) <=0){
		var dateId = beginDateToDeal.getDateId();
		var tds = this.findEmptyRow(beginDateToDeal,dayCountToDeal);
		var setMore;
		var $event;
		var i=0;
		while(dayCountToDeal >= 0){
			var $event = tds[i++];
			var $content = $event.children(".d-event-content:first");
			if(!$event.hasClass("more-activity")){
				var content = activity.fields.content;
				if(content == "") content="无内容";
				if(activity.fields.isWholeDay == false){
					var beginTimeStr = new TimeZoneDate(activity.fields.beginDateTime).toTimeString();
					content = beginTimeStr + " " + content;
				}

				if(isDurative)
					$event.addClass("durative");
				content = getShort(content);
				$content.html(content);
				$event.attr("activity",activity.pk);
				$event.attr("gen-id",genId);
			}
			else{
				if(!$event.is(".empty") && $event.hasClass("more-activity")){
					var moreCount = $event.attr("more-count");
					if(isUndefined(moreCount))
						moreCount = 2;
					else{
						moreCount = Number(moreCount);
						moreCount += 1;
					}
				}else if($event.hasClass("empty")){
					var moreCount = 1;
				}
				
				$event.addClass("more-activity");
				$event.attr("id",null);
				$event.attr('more-count',moreCount);
				$event.attr('activity',null);
				$content.html(moreString1 + moreCount + moreString2);
			}
			$event.removeClass("empty");
			$event = $event.next();
			dayCountToDeal -= 1;
			beginDateToDeal.addDays(1);
			if($event.size() == 0)
				break;
		}
	}
}
/*****************************************************
*找寻一行可以放置指定数量的事件行
*****************************************************/
Calendar.prototype.findEmptyRow = function(date,count){
	var dateId = date.getDateId();
	var $monthRow = this.findMonthRowByDate(date);
	this.addNewEventLine($monthRow);
	
	var $eventRows = $monthRow.children(".t-month-row-event:first").find("tr");
	var i = 0;
	var countTemp = count;
	var $eventRow;
	var result = [];
	
	for(i=1;i<$eventRows.size();i++){
		result = [];
		countTemp = count;
		$eventRow = $eventRows.eq(i);
		var setMore = $eventRow.hasClass("more-activity");
		var $td = $eventRow.find(".td-event[date-id=" + dateId + "]:first");
		if(setMore == true)
			$td.addClass("more-activity");
		result.push($td);
		var okFlag = false;
		if(($td.size() != 0 && $td.hasClass("empty")) || setMore == true){
			var $tdNexts = $td.nextAll();
			var j=0;
			while((countTemp-=1) >= 0){
				$td = $tdNexts.eq(j);
				if($td.size() == 0){
					okFlag = true;
					break;
				}
				else if(setMore == true){
					$td.addClass("more-activity");
				}
				else if(!$td.hasClass("empty") && !$td.hasClass("more-acivity"))
					break;
				
				result.push($td);
				j += 1;
			}
		}
		if(okFlag == true || countTemp <0)
			return result;
	}
}
/*****************************************************
*合并事件
*****************************************************/
Calendar.prototype.mergeEventColumn = function(){
	var $eventRows = this._$calendarDiv.find(".d-month-body").find(".tr-event-row");
	for(var i=0;i<$eventRows.size();i++){
		var $eventRow = $eventRows.eq(i);
		var $eventCols = $eventRow.find("td");
		var $eventColPrev = $eventCols.first();
		var $eventColNext = $eventCols.next(":first");
		
		while($eventColNext.size() != 0){
			if(!$eventColNext.hasClass("empty") 
				&& ($eventColNext.attr("activity") == $eventColPrev.attr("activity"))
				&& !$eventColNext.hasClass("more-activity") && !$eventColPrev.hasClass("more-activity")
				&& $eventColNext.attr("gen-id") == $eventColPrev.attr("gen-id")
			){
				var colSpan = $eventColPrev.attr("colspan");
				if(isUndefined(colSpan)) 
					colSpan = 2;
				else
					colSpan = Number(colSpan) + 1;
					
				$eventColNext.remove();	
				$eventColPrev.attr("colspan",colSpan);
				$eventColNext = $eventColPrev.next();
			}
			else{
				$eventColNext = $eventColNext.next(":first");
				$eventColPrev = $eventColPrev.next(":first");
			}
		}
	}
}
/*****************************************************
*通过日期找到所要处理的月日历日期行div
*****************************************************/
Calendar.prototype.findMonthRowByDate = function(date){
	var dateId ;
	if(typeof(date) == 'string')
		dateId = date;
	else 
		dateId = date.getDateId();	
	//遍历每一个日历行来查看是否符合日期要求
	for(var i=0;i<this._$monthRows.size();i++){
		var $monthRow = this._$monthRows.eq(i);
		var beginDateId = $monthRow.attr("begin-date");
		var endDateId = $monthRow.attr("end-date");
		if(beginDateId<=dateId && dateId<=endDateId){
			return $monthRow;
		}
	}	
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
*新插入一行空事件栏
*****************************************************/
Calendar.prototype.addNewEventLine = function($monthRow,num){
	if(isUndefined(num)) num = 1;
	var $template;
	while((num -= 1) >= 0){
		$template = Calendar.$t_trRowEvent.clone();
		var $monthRowEvent = $monthRow.children(".t-month-row-event:first");
		var $monthRowEventTr = $monthRowEvent.find("tr");
		var $base = $monthRow.find(".td-day-grid-bg");
		if(isUndefined(this._dMonthRowCanMore[$monthRow.attr("id")]) || this._dMonthRowCanMore[$monthRow.attr("id")]==true){
			//判断是否能容纳下更多的事件行
			var totalHeight = ($monthRowEventTr.size() + 1)* this._trHeight;
			if(totalHeight > this._limitHeight){
				this._canMoreMonthRow = false;
				$template = $monthRowEventTr.last();			
				$template.addClass("more-activity");
				this._dMonthRowCanMore[$monthRow.attr("id")] = false;
				return $template;
			}
		}
		else{
			return $monthRowEventTr.last();
		}
		//设置日期
		var $allTds = $template.find("td");
		for(var i=0;i<$allTds.size();i++){
			var $td = $allTds.eq(i);
			$td.attr("date-id",$base.eq(i).attr("date-id"));
		}
		
		//添加行
		$monthRowEvent
			.find("tbody")
			.append($template);
	}
	return $template;
}
/*****************************************************
*清除已有事件及日历
*****************************************************/
Calendar.prototype.clearMonth = function(){
	var $monthBody = $(this._$calendarDiv).find(".d-month-body");
	$monthBody.html("");
}

/*****************************************************
*根据指定月份，从服务器获取活动列表并储存
*****************************************************/
Calendar.prototype.getActivity = function(option){
	var optionDefault = {forceUpdate:false,repeat:false};
	if(!isUndefined(option)){
		option = $.extend(optionDefault,option)
	}else{
		option = optionDefault;
	}
	var dates = [];
	var calendar = this;
	var monthId = this._calendarDate.getMonthId();
	var beginDate = Calendar._monthDate[monthId][0];
	var endDate = Calendar._monthDate[monthId][Calendar._monthDate[monthId].length - 1];
	
	dates.push(beginDate.toISOString());
	dates.push(endDate.toISOString());
	if(dates.length != 0){
		$.ajax({url:"/calendar/get/activity/",
				data:JSON.stringify({"date":dates}),
				type:"post",
				async:false,
				success:function(data){
					calendar._activity = data['activity'];
					for(i=0;i<data['repeat'].length;i++){
						findAndUpdateObject(calendar._repeat,"pk",data.repeat[i].pk,data.repeat[i],'update');
					}
				},
			});
	}else{
		return false;
	}
	
	// sortActivity(this._activityCache);
	this.cacheActivity(this._activity);
	this._activityCacheList[monthId] = true;
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

Calendar.prototype.cacheRepeat = function(repeats,action){
	if(!isUndefined(repeats) && !(repeats instanceof Array)){
		repeats = [repeats];
	}
	for(var i=0;i<repeats.length;i++){
		var repeat = repeats[i];
		findAndUpdateObject(this._repeat,"pk",repeat.pk,repeat,'update');
	}
}

Calendar.prototype.switchToMonth = function(){
	switchContainer($("#calendar-activity-detail"),this._$calendarDiv.children(".calendar:first"));
}

/*****************************************************
*添加过滤条件
*****************************************************/
Calendar.prototype.addFilter = function(option){
	this._filterOption.push(option);
}
/*****************************************************
*删除过滤条件
*****************************************************/
Calendar.prototype.removeFilter = function(option){
	for(var i=0;i<this._filterOption.length;i++){
		if(option.field == this._filterOption[i].field
			&& option.type == this._filterOption[i].type
			&& option.val == this._filterOption[i].val){
			
			this._filterOption.splice(i,1);
		}
	}
}
/*****************************************************
*根据特定日期来展示活动列表
*****************************************************/


Calendar.getId = function(){
	return "calendar-" + Calendar.nowId++;
}

/*****************************************************
*从指定的日期获取活动列表
*****************************************************/
function getActivityByDate(arr,beginDate,endDate){
	var acts = [];
	for(var i=0;i<arr.length;i++){
		var act = arr[i];
		var actBegin = new TimeZoneDate(getObjectField(act,"fields.beginDateTime"));
		var actEnd = new TimeZoneDate(getObjectField(act,'fields.endDateTime')).clearTime();
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
/*****************************************************
*获得一个活动的重复信息
*****************************************************/
Calendar.prototype.getRepeat = function(activity){
	return getObjectInArray(this._repeat,"pk",activity.fields.repeat);
}

/*****************************************************
*获得一个活动所要处理所有范围内的日期
*****************************************************/
Calendar.prototype.getDealObject = function(activity,limitBegin,limitEnd){
	var result = [];
	var dateToDeal = [];
	if(activity.fields.repeat != null){
		dateToDeal = this.getRepeatDate(activity,limitBegin,limitEnd);
	}
	else{
		var beginDate = new TimeZoneDate(activity.fields.beginDateTime).clearTime();
		var endDate = new TimeZoneDate(activity.fields.endDateTime).clearTime();
		var r = Calendar.getDateBetween(beginDate,endDate,limitBegin,limitEnd);
		if(r!=null) dateToDeal.push(r);
	}
	
	for(i=0;i<dateToDeal.length;i++){
		var dealObject = {};
		dealObject.beginDate = dateToDeal[i][0];
		dealObject.endDate = dateToDeal[i][1];
		dealObject.activity = activity;
		result.push(dealObject);
	}
	return result;
}


/*****************************************************
*根据时间范围给出一个重复性事件所要显示的天数
*****************************************************/
Calendar.prototype.getRepeatDate = function(activity,limitBegin,limitEnd){
	var result = [];
	
	if(activity.fields.repeat == null)	
		return result;
	
	var oldBegin = new TimeZoneDate(activity.fields.beginDateTime);
	var oldEnd = new TimeZoneDate(activity.fields.endDateTime);
	
	var oldBetween = TimeZoneDate.dayBetween(oldBegin,oldEnd);
	var oldYear = oldBegin.getYear();
	var oldMonth = oldBegin.getMonth();
	var oldDate = oldBegin.getDate();
	var oldWeekOfMonth = oldBegin.getWeekOfMonth();
	var oldDay = oldBegin.getDay();
	
	var repeat = this.getRepeat(activity);

	
	var interval = repeat.fields.interval;
	var limitBeginTemp = limitBegin.clone();
	
	if(limitBeginTemp.isBefore(oldBegin)) {
		limitBeginTemp = oldBegin.clone();
	}
	
	while(TimeZoneDate.compare(limitBeginTemp,limitEnd)<=0){
		var r=null;
		if(repeat.fields.intervalType == 'Y'){
			if((limitBeginTemp.getYear() - oldYear) % interval == 0){
				if(limitBeginTemp.getMonth() == oldMonth && limitBeginTemp.getDate() == oldDate)
					r = Calendar.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd);
			}
		}
		else if(repeat.fields.intervalType == 'M'){
			var monthBetween = 12 * (limitBeginTemp.getYear() - oldYear) + limitBeginTemp.getMonth() - oldMonth;
			if(monthBetween % interval ==0){
				if(repeat.fields.week == false){
					if(limitBeginTemp.getDate() == oldDate)
						r = Calendar.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd);
				}
				else{
					if(limitBeginTemp.getWeekOfMonth() == oldDate && limitBeginTemp.getDay() == oldDay)
						r = Calendar.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 
				}
			}
		}
		else if(repeat.fields.intervalType == 'W'){
			var weekDays = repeat.fields.dayOfWeek;
			var weeksBetween = TimeZoneDate.weekBetween(oldBegin,limitBeginTemp);
			if(weeksBetween % interval == 0){
				if(weekDays.indexOf(limitBeginTemp.getDay()+"") != -1)
					r = Calendar.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 
			}
		}
		else if(repeat.fields.intervalType == 'D'){
			var daysBetween = TimeZoneDate.dayBetween(oldBegin,limitBeginTemp);
			if(daysBetween % interval == 0){
				r = Calendar.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 	
			}
		}
		
		if(r!=null){
			if(TimeZoneDate.compare(r[0],r[1]) != 0)
				r[2] = true;
			else
				r[2] = false;
			result.push(r);
		}
			
		limitBeginTemp.addDays(1);
	}
	return result;
}


/*****************************************************
*获得范围内所要处理的日期
*****************************************************/
Calendar.getDateBetween = function(begin,end,limitBegin,limitEnd){
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
