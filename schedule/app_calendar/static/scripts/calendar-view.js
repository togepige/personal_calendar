//全局数据
Calendar.view.calendarDate = null;
Calendar.view.$ = {};
Calendar.view.$.main = $("#calendar-view");
Calendar.view.$.month = $("#calendar-view-month");
Calendar.view.$.monthBody = Calendar.view.$.month.find(".d-month-body");
Calendar.view.$.template = $("#calendar-template");
Calendar.view.$.detail = $("#calendar-activity-detail");
Calendar.view.$.eventRowTemplate = Calendar.view.$.template.find(".tr-event-row:first");
Calendar.view.$.eventBroswerRowTemplate = Calendar.view.$.template.find(".tr-event-broswer:first");

Calendar.view.$.monthRowTemplate = Calendar.view.$.template.find(".d-month-row:first");
Calendar.view.month = {};
Calendar.view.month.func = {};
Calendar.view.filterOption = [];
Calendar.view.func = {};
Calendar.view.event = {};
Calendar.view.month.event = {};
Calendar.view.month.weekDays = [];
Calendar.view.month.monthRowCanMore = {};
Calendar.view.lastMouseWheelDate = null;
Calendar.view.monthWheelInterval = 600;

Calendar.view.detail = {};
Calendar.view.detail.func = {};
Calendar.view.detail.event = {};

Calendar.view.detail.submitOption = $.extend({beforeSerialize:function($form,options){
		var beginDate = new TimeZoneDate($form.find("[name=begin-date]").val());
		var endDateTime = new TimeZoneDate($form.find("[name=end-date]").val());
		
		$form.find("[name=is-whole-day]").val(true);
		if($form.find("[name='c-is-whole-day']").attr("checked") != "checked"){
			beginDate.setTime($form.find("[name=begin-time]").val());
			endDateTime.setTime($form.find("[name=end-time]").val());
			$form.find("[name=is-whole-day]").val(false);
		}
		$form.find("[name=end-datetime]").val(endDateTime);
		$form.find("[name=begin-datetime]").val(beginDate);
		
		//重复性事件的相关表单设置
		if($form.find('[name=c-is-repeat]').attr("checked") == "checked"){
			$form.find('[name=is-repeat]').val(true);
		}else{
			$form.find('[name=is-repeat]').val(false);
		}
		
		if($form.find('[name=repeat-type]').val() == 'W'){
			var checkedDays = "";
			$weekDays = $form.find(".controls .weekdays");
			$days = $weekDays.find(":checkbox");
			for(var i=0;i<$days.size();i++){
				if($days.eq(i).attr("checked") == 'checked'){
					checkedDays += $days.eq(i).attr("name")[8] + ',';
				}
			}
			$form.find("[name=repeat-weekday]").val(checkedDays);
		}
		if($form.find('[name=end-type]:checked').val() == 'D'){
			$form.find('[name=date-to-end]').val(
				new TimeZoneDate($form.find('[name=date-to-end]').val()).toISOString()
			);
		}
	}}
	,Calendar.activity.submitOption
);



Calendar.timeArray =  ["00:00","00:30","01:00","01:30",
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
				"22:00","22:30","23:00","23:30"];
/*****************************************************
*初始化函数
*****************************************************/
Calendar.view.init = function(){
	for(var e in Calendar.view.event)
		Calendar.view.event[e]();


	for(var e in Calendar.view.month.event)
		Calendar.view.month.event[e]();
	
	for(var e in Calendar.view.detail.event)
		Calendar.view.detail.event[e]();

		
	Calendar.view.calendarDate = Calendar.today.clone();
	
	Calendar.view.month.func.setFirstDayOfWeek();
}		
/*****************************************************
*设置月视图的每周开始于哪一天
*****************************************************/	
Calendar.view.month.func.setFirstDayOfWeek = function(){
	//设置月视图中的周开始设置
	if(Calendar.models.userSetting.fields.firstDayOfWeek == '0')
		Calendar.view.month.weekDays = ["周天","周一","周二","周三","周四","周五","周六"];
	else if(Calendar.models.userSetting.fields.firstDayOfWeek == '1')
		Calendar.view.month.weekDays = ["周一","周二","周三","周四","周五","周六","周天"];
	
	var $weekDays = Calendar.view.$.month.find(".d-month-head td");
	
	for(var i=0;i<7;i++){
		$weekDays.eq(i).html(Calendar.view.month.weekDays[i]);
	}
}
Calendar.view.func.updateConfig = function(){
	Calendar.monthDateArray = {}; 
	Calendar.view.month.func.setFirstDayOfWeek();
	Calendar.view.func.refresh();
}
Calendar.view.func.refresh = function(force){
	Calendar.view.month.func.refresh();
}

Calendar.view.month.func.refresh = function(){
	Calendar.view.month.func.showMonth();
	Calendar.view.month.func.showActivity();
}	

/*****************************************************
*前后移动月份
*****************************************************/
Calendar.view.month.func.moveMonth = function(delta){
	Calendar.view.calendarDate.addMonths(delta);
	Calendar.view.month.func.refresh();
}
/*****************************************************
*显示月视图日历
*****************************************************/
Calendar.view.month.func.showMonth = function(){

	var monthId = Calendar.view.calendarDate.getMonthId();

	var dateArray = Calendar.func.getMonthDateArray(monthId);
	var rowCount = dateArray.length / 7;
	
	var rowHeightPercent = 1 / rowCount;
	var rowHeight = Tools.toPercent(rowHeightPercent);
	
	//设置日历行数
	if(rowCount == 5)
		Calendar.view.$.monthBody.children(".d-month-row:eq(5)").detach();
	else
		Calendar.view.$.monthBody.append(Calendar.view.$.monthRowTemplate.clone());
	
	//首先清除已有样式
	// this.clearMonth();
	//设置每行的位置和高度
	var $dMonthRows = Calendar.view.$.monthBody.children(".d-month-row");
	
	for(var i=0;i<rowCount;i++){
		var $monthRow = $dMonthRows.eq(i);
		
		$monthRow.attr("id",Calendar.func.getId());
		//清除行下的事件
		var $monthRowEvent = $monthRow.children(".t-month-row-event");
		$monthRowEvent.find(".t-month-row-event").detach();
		//设置位置和高度
		var rowPosition = Tools.toPercent(rowHeightPercent * i);
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
			
			if(dateArray[count].getMonth() != Calendar.view.calendarDate.getMonth())
				$dayGridTitle.addClass("gray");
			else
				$dayGridTitle.removeClass("gray");

			//设置所归属的日历行的起始终止日期
			if(j == 0)
				$monthRow.attr("begin-date",dateArray[count].getDateId());
			if(j == 6)
				$monthRow.attr("end-date",dateArray[count].getDateId());
			//设置今天格子
			if(dateArray[count].getMonth() == Calendar.today.getMonth()
				&& dateArray[count].getYear() == Calendar.today.getYear()
				&& dateArray[count].getDate() == Calendar.today.getDate()){
				$dayGridBg.addClass("today");
			}else{
				$dayGridBg.removeClass("today");
			}
		}
	}
	//将当前显示日期赋给所要显示的当前月份的label
	Calendar.view.$.main.find("#calendar-title").html(
		moment(Calendar.view.calendarDate).format("L")
	);
	
	Calendar.view.$.monthRows = $dMonthRows;
	Calendar.view.month.trHeight = $dMonthRows.find(".t-month-row-event:first tr:first").height();
	Calendar.view.month.limitHeight = $dMonthRows.find(".t-month-row-base:first").height();
}
/*****************************************************
*显示活动
*****************************************************/
Calendar.view.month.func.showActivity = function(){

	var monthId = Calendar.view.calendarDate.getMonthId();
	Calendar.activity.func.getActivity(monthId);
	Calendar.view.$.monthBody.find(".tr-event-row").detach();
	var dateArray = Calendar.func.getMonthDateArray(monthId);
	
	var limitBegin = dateArray[0];
	var limitEnd = dateArray[dateArray.length-1];
	
	var dealObjects = [];
	for(var i=0;i<Calendar.models.activity.length;i++){
		act = Calendar.models.activity[i];
		if(Objects.isObjectShouldBeFilter(act,Calendar.view.filterOption) == true) continue;
		dealObjects = dealObjects.concat(Calendar.view.month.func.getDealObject(act,limitBegin,limitEnd));
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
		Calendar.view.month.func.activityToCalendar(dealObjects[j]);
		
	Calendar.view.month.func.mergeEventColumn();
}
/*****************************************************
*根据获得的活动处理对象将活动展示到日历上
*****************************************************/
Calendar.view.month.func.activityToCalendar = function(dealObject){
	var genId = Calendar.func.getId();
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
		var tds = Calendar.view.month.func.findEmptyRow(beginDateToDeal,dayCountToDeal);
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
Calendar.view.month.func.findEmptyRow = function(date,count){
	var dateId = date.getDateId();
	var $monthRow = Calendar.view.month.func.findMonthRowByDate(date);
	Calendar.view.month.func.addNewEventLine($monthRow);
	
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
*通过日期找到所要处理的月日历日期行div
*****************************************************/
Calendar.view.month.func.findMonthRowByDate = function(date){
	var dateId ;
	if(typeof(date) == 'string')
		dateId = date;
	else 
		dateId = date.getDateId();	
	//遍历每一个日历行来查看是否符合日期要求
	for(var i=0;i<Calendar.view.$.monthRows.size();i++){
		var $monthRow = Calendar.view.$.monthRows.eq(i);
		var beginDateId = $monthRow.attr("begin-date");
		var endDateId = $monthRow.attr("end-date");
		if(beginDateId<=dateId && dateId<=endDateId){
			return $monthRow;
		}
	}	
}
/*****************************************************
*新插入一行空事件栏
*****************************************************/
Calendar.view.month.func.addNewEventLine = function($monthRow,num){
	if(isUndefined(num)) num = 1;
	var $template;
	while((num -= 1) >= 0){
		$template = Calendar.view.$.eventRowTemplate.clone();
		var $monthRowEvent = $monthRow.children(".t-month-row-event:first");
		var $monthRowEventTr = $monthRowEvent.find("tr");
		var $base = $monthRow.find(".td-day-grid-bg");
		if(isUndefined(Calendar.view.month.monthRowCanMore[$monthRow.attr("id")]) || Calendar.view.month.monthRowCanMore[$monthRow.attr("id")]==true){
			//判断是否能容纳下更多的事件行
			var totalHeight = ($monthRowEventTr.size() + 1) * Calendar.view.month.trHeight;
			if(totalHeight > Calendar.view.month.limitHeight){
				// this._canMoreMonthRow = false;
				$template = $monthRowEventTr.last();			
				$template.addClass("more-activity");
				Calendar.view.month.monthRowCanMore[$monthRow.attr("id")] = false;
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
*获得所需要处理的日期对象
*****************************************************/
Calendar.view.month.func.getDealObject = function(activity,limitBegin,limitEnd){
	var result = [];
	var dateToDeal = [];
	if(activity.fields.repeat != null)
		dateToDeal = Calendar.view.func.getRepeatDate(activity,limitBegin,limitEnd);

	else{
		var beginDate = new TimeZoneDate(activity.fields.beginDateTime).clearTime();
		var endDate = new TimeZoneDate(activity.fields.endDateTime).clearTime();
		var r = Calendar.func.getDateBetween(beginDate,endDate,limitBegin,limitEnd);
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
*获取重复日历类型的处理日期
*****************************************************/
Calendar.view.func.getRepeatDate = function(activity,limitBegin,limitEnd){
	var result = [];
	var repeat = Objects.getObjectInArray(Calendar.models.repeat,"pk",activity.fields.repeat);

	if(activity.fields.repeat == null || repeat == null)	
		return result;
	
	var oldBegin = new TimeZoneDate(activity.fields.beginDateTime);
	var oldEnd = new TimeZoneDate(activity.fields.endDateTime);
	
	var oldBetween = TimeZoneDate.dayBetween(oldBegin,oldEnd);
	var oldYear = oldBegin.getYear();
	var oldMonth = oldBegin.getMonth();
	var oldDate = oldBegin.getDate();
	var oldWeekOfMonth = oldBegin.getWeekOfMonth();
	var oldDay = oldBegin.getDay();
	
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
					r = Calendar.func.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd);
			}
		}
		else if(repeat.fields.intervalType == 'M'){
			var monthBetween = 12 * (limitBeginTemp.getYear() - oldYear) + limitBeginTemp.getMonth() - oldMonth;
			if(monthBetween % interval ==0){
				if(repeat.fields.week == false){
					if(limitBeginTemp.getDate() == oldDate)
						r = Calendar.func.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd);
				}
				else{
					if(limitBeginTemp.getWeekOfMonth() == oldDate && limitBeginTemp.getDay() == oldDay)
						r = Calendar.func.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 
				}
			}
		}
		else if(repeat.fields.intervalType == 'W'){
			var weekDays = repeat.fields.dayOfWeek;
			var weeksBetween = TimeZoneDate.weekBetween(oldBegin,limitBeginTemp);
			if(weeksBetween % interval == 0){
				if(weekDays.indexOf(limitBeginTemp.getDay()+"") != -1)
					r = Calendar.func.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 
			}
		}
		else if(repeat.fields.intervalType == 'D'){
			var daysBetween = TimeZoneDate.dayBetween(oldBegin,limitBeginTemp);
			if(daysBetween % interval == 0){
				r = Calendar.func.getDateBetween(limitBeginTemp,limitBeginTemp.clone().addDays(oldBetween),limitBegin,limitEnd); 	
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
*合并事件
*****************************************************/
Calendar.view.month.func.mergeEventColumn = function(){
	var $eventRows = Calendar.view.$.monthBody.find(".tr-event-row");
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
*添加活动过滤器
*****************************************************/
Calendar.view.func.addFilter = function(option){
	Calendar.view.filterOption.push(option);
}
/*****************************************************
*删除过滤器
*****************************************************/
Calendar.view.func.removeFilter = function(option){
	Objects.func.update(Calendar.view.filterOption,option,null,'delete',function(obj1,obj2){
		if(obj1.field == obj2.field
			&& obj1.type == obj2.type
			&& obj1.val == obj2.val)
			return 0;
		else
			return 1;
	})
}
/*****************************************************
*设置每一个日历对象的事件响应
*****************************************************/
Calendar.view.event.dealWithMenuBarEvent = function(calendar){
	Calendar.view.$.main.find(".btn-today").click(function(){
		Calendar.view.calendarDate = Calendar.today.clone();
		Calendar.view.func.refresh();
	});
	
	Calendar.view.$.main.find(".btn-next-month").click(function(){
		Calendar.view.calendarDate.addMonths(1);
		Calendar.view.func.refresh();
	});
	
	Calendar.view.$.main.find(".btn-last-month").click(function(){
				Calendar.view.calendarDate.addMonths(-1);
		Calendar.view.func.refresh();
	});
}
/*****************************************************
*月日历事件
*****************************************************/
Calendar.view.month.event.initMonthEvent = function(){
	//简单的添加窗口显示
	Calendar.view.$.monthBody.on('click',".td-day-grid-bg,.td-day-grid-title,.td-event.empty",function(){
		var $modal = $("#simple-add-modal");
		var $form = $modal.find("form:first");
		var beginDateTime = new TimeZoneDate($(this).attr("date-id"));
		showModal($modal,$(this));
		focusOnFirst($modal);
		clearForm($modal);
		$form.find("[name=begin-datetime]").val(beginDateTime.toString());
		$form.find(".clicked-date").html(moment(beginDateTime).format("LL"));
	});
	
	Calendar.view.$.monthBody.on('click',' .d-month-row .td-event[activity]',function(){
		var pk = $(this).attr("activity");
		var act = Objects.getObjectInArray(Calendar.models.activity,"pk",pk);
		Calendar.modal.func.showSimpleEdit(act,$(this));
	});
	
	//月视图上的鼠标滚轮事件响应
	Calendar.view.$.monthBody.on('mousewheel',function(event,delta){
		if(Calendar.view.lastMouseWheelDate == null) {
			Calendar.view.lastMouseWheelDate = new Date();
			Calendar.view.month.func.moveMonth(-delta);
			return true;
		}
		var tempDate = new Date();
		var interval = tempDate.getTime() - Calendar.view.lastMouseWheelDate.getTime();
		if(interval < Calendar.view.mouseWheelInterval) return false;
		Calendar.view.lastMouseWheelDate = tempDate;
		Calendar.view.month.func.moveMonth(-delta);
		return false;
	});
	//时间选择的相关事件设置
	$(".time").autocomplete({
		source:Calendar.timeArray,
		minLength:0,
		delay:100,
	});
	$(".time").click(function(){
		$(this).autocomplete("search","");
	});	
	
	//点击查看更多事件时的响应
	Calendar.view.$.monthBody.on("click"," .t-month-row-event tr.more-activity>td.more-activity",function(){
		Calendar.modal.func.showActivityBroswer(new TimeZoneDate($(this).attr("date-id")));
	});
	
	$('#calendar-activity-broswer').on('click',' .td-event',function(){
		var pk = $(this).attr("activity");
		var act = getObjectInArray(Calendar.models.activity,"pk",pk);
		Calendar.modal.$.activityBroswer.modal("hide");
		Calendar.modal.func.showSimpleEdit(act);
	});
}

/*****************************************************
*modal的相关事件
*****************************************************/
Calendar.view.event.initActionEvent = function(calendar){
	//创建新活动窗口的提交事件
	$("#simple-add-modal .simple-submit").click(function(){
		Calendar.activity.func.submit($("#simple-add-modal").find("form"),'new');
	});
	
	$("#simple-edit-modal #simple-update").click(function(){
		Calendar.activity.func.submit($("#simple-edit-modal").find("form:first"),'update');
	});
	
	$(".edit-detail").click(function(){
		Calendar.view.detail.func.showEditDetail($(this).closest(".modal").find("form:first"));
	});
	
	$("#calendar-activity-detail").find("#activity-detail-submit").click(function(){
		Calendar.view.detail.func.submit();
	});
	
	$("#calendar-activity-detail").find("#activity-detail-cancel").click(function(){
		toContainer(Calendar.view.$.main);
	});
	
	$(".activity-delete").click(function(){
		$form = $(this).closest(".activity-form-container").find("form:first");
		$form.find("[name=action]").val("delete");
		Calendar.activity.func.submit($form);
	});
}

Calendar.view.detail.event.initSelectEvent = function(){
	//日期选择的事件处理
	Calendar.view.$.detail.find("[name='c-is-whole-day']").click(function(){
		if($(this).attr("checked")=="checked"){
			$container.find("[name='begin-time']").hide();
			$container.find("[name='end-time']").hide();
					
		}else{
			$container.find("[name='begin-time']").show();
			$container.find("[name='end-time']").show();
		}
	});
	//重复类型中，周重复的相关事件
	Calendar.view.$.detail.find("[name=repeat-type]").change(function(){
		var selectedItem = $(this).val();
		if(selectedItem == 'W'){
			$container.find(".controls .weekdays").show();
		}else{
			$container.find(".controls .weekdays").hide();
		}
	});
}

Calendar.view.detail.func.showEditDetail = function($form){
	Calendar.view.detail.func.initDetailForm();
	
	Calendar.view.detail.func.setActivityDetail($form);
	
	switchContainer(Calendar.view.$.main,function(){
		var $detail = Calendar.view.$.detail;
		if(isUndefined($detail.find("[name=c-is-whole-day]").attr("checked"))){
			$detail.find(".time").show();
		}
		if($detail.find("[name=c-is-repeat]").attr("checked") == 'checked'){
			$($detail.find("[name=c-is-repeat]").attr("data-target")).collapse('show');
			if($detail.find("[name=repeat-type]").val() == 'W'){
				$detail.find(".weekdays:first").show();
			}
			
		}else{
			$($detail.find("[name=c-is-repeat]").attr("data-target")).collapse('hide');
		}
	});
	
	toContainer(Calendar.view.$.detail,function(){
		var $detail = Calendar.view.$.detail;
		if(isUndefined($detail.find("[name=c-is-whole-day]").attr("checked"))){
			$detail.find(".time").show();
		}
		if($detail.find("[name=c-is-repeat]").attr("checked") == 'checked'){
			$($detail.find("[name=c-is-repeat]").attr("data-target")).collapse('show');
			if($detail.find("[name=repeat-type]").val() == 'W'){
				$detail.find(".weekdays:first").show();
			}
			
		}else{
			$($detail.find("[name=c-is-repeat]").attr("data-target")).collapse('hide');
		}
	});
}

Calendar.view.detail.func.initDetailForm = function(){
	clearForm($("#activity-detail-form"));
	Calendar.view.$.detail.find("[name=repeat-type]").val('D');
	Calendar.view.$.detail.find("[name=repeat-interval]").val('1');
	Calendar.view.$.detail.find(".weekdays").hide();
	Calendar.view.$.detail.find(":checkbox").attr("checked",false);
	Calendar.view.$.detail.find("[name-endtype]").attr("checked",true);
}

/*****************************************************
*将已有的活动表单数据传送至详细编辑界面的表单
*****************************************************/
Calendar.view.detail.func.setActivityDetail = function($form){
	var $detail = Calendar.view.$.detail;
	
	$detail.find("[name='begin-time']").hide();
	$detail.find("[name='end-time']").hide();
										
	//用户日历本的设置
	var jqCalendarBook = $detail.find("select[name='calendar-book']");
	var calendarBooks = Calendar.models.calendarBook;
	var valueField = 'pk';
	var contentField = 'fields.name';
	Forms.func.valueToSelect(jqCalendarBook,calendarBooks,valueField,contentField);

	//设置已有数据
	var dataObj = {};
	dataObj['title'] = $form.find("[name=title]").val();
	dataObj['content'] = $form.find("[name=content]").val();
	if($form.find("[name='pk']").size() != 0){
		act = Objects.getObjectInArray(Calendar.models.activity,"pk",$form.find("[name='pk']").val());

		beginDateTime = new TimeZoneDate(act.fields.beginDateTime);
		endDateTime = act.fields.endDateTime == null
						? beginDateTime.clone()
						: new TimeZoneDate(act.fields.endDateTime);
		
		dataObj['pk'] = act.pk;
		dataObj['calendar-book'] = act.fields.calendarBook;
		dataObj['begin-date'] = beginDateTime.date();
		dataObj['begin-time'] = beginDateTime.getTimeString();
		dataObj['end-date'] = endDateTime.date();
		dataObj['end-time'] = endDateTime.getTimeString();
		dataObj['location'] = act.fields.location;
		dataObj['c-is-whole-day'] = act.fields.isWholeDay;
		if(act.fields.repeat != null){
			var repeat = Objects.getObjectInArray(Calendar.models.repeat,"pk",act.fields.repeat);
			dataObj['c-is-repeat'] = true;
			dataObj['repeat-type'] = repeat.fields.intervalType;
			dataObj['repeat-interval'] = repeat.fields.interval;
			if(repeat.fields.intervalType == 'W'){
				var weekDays = repeat.fields.dayOfWeek.split(',');
				for(var i=0;i<weekDays.length;i++){
					var cbName = 'weekday-' + weekDays[i];
					dataObj[cbName] = true;
				}
			}
		}
	}
	else{
		dataObj['begin-date'] = new TimeZoneDate($form.find("[name=begin-datetime]").val()).getDateString();
		dataObj['begin-time'] = "00:00"; 
		
		dataObj['end-date'] = dataObj['begin-date']
		dataObj['end-time'] = "00:00"; 
		dataObj['c-is-whole-day'] = true;
		dataObj['c-is-repeat'] = false;
	}
	
	Forms.func.dataObjToForm(dataObj,$detail.find("form"));
}

Calendar.view.detail.func.submit = function(){
	Calendar.view.$.detail.find("form:first").ajaxSubmit(Calendar.view.detail.submitOption);
	toContainer(Calendar.view.$.main,function(){
		Calendar.view.month.func.refresh();
	});
}









