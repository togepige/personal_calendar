/*
如果没有特殊说明，月份的初始值为0
也就是说1月在传入函数时应当为0。
*/
/***********************************************************************************
*除了用于显示在网页日历上的日历，其他一切用于计算的日历全都不做加工
*也就是说有如下约束
*年份的获取统一用date.getFullYear();方法来获得
*月份的计算是从0~11(为了统一标准，先一致改为1~12)
*日期的计算是从1~31
*星期的计算是周天~周一分别对应0~6
***********************************************************************************/
//初始化参数，表示当前日期和时间
var nowDate;
//初始化参数，表示当前日历显示的日期和时间
var calendarDate;
 
var oneDaySecond = 86400000;//一天的秒数，用于计算前后天数
var mouseWheelInterval = 600;//滚轮时间的最小间隔
var lastMouseWheelDate;//记录最后触发滚轮事件的时间
var nowEditDate;//当发生日期编辑事件时进行更新

//全局日历数据
var activity = {};
var requiredInfo = {};
var durativeActivity = [];
var activityToShow = {};

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
			refreshActivity(message["action"],message["activity"]);
			
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

var nowEventHeight;
var nowDayGridHeight;

$(document).ready(function(){
	
	cheatFunction();
	
	getRequiredInfo();
	
	initializeDate();
	
	setCalendarEntrance();	
	
	dealWithCalendarToolBar();
	
	dealWithMonthCalendar();
	
	dealWithSimpleEdit();
	
	calendarLeftNavSet();
	
	dealWithActivityDetail();
	
	dealWithRepeat();
	
	// $("#nav-quick-calendar").datepicker("option","changeYear",false);
	// $("#nav-quick-calendar").datepicker("option","changeMonth",false);
	// $("#nav-quick-calendar").datepicker("option","autoSize",True);
	$("#nav-quick-calendar").datepicker();
	
	$("#nav-quick-calendar").find(".ui-datepicker").css("width","auto");
});
/***********************************************************************************
*初始化日期变量
***********************************************************************************/
function initializeDate(){
	nowDate = new TimeZoneDate(requiredInfo['today']).clearTime();
	calendarDate = nowDate.clone();
}
/*****************************************************
*日历工作条的事件处理
*****************************************************/
function dealWithCalendarToolBar(){
	$("#next-month").click(function(){
		setCalendarEntrance(1);
	});

	$("#last-month").click(function(){
		setCalendarEntrance(-1);
	});
	
	$("#today").click(function(){
		setCalendarEntrance();
	});
}
/*****************************************************
*月日历视图的事件处理
*****************************************************/
function dealWithMonthCalendar(){
	//月视图上的鼠标滚轮事件响应
	$(".month").mousewheel(function(event,delta){
		if(typeof(lastMouseWheelDate) == "undefined") {
			lastMouseWheelDate = new Date();
			setCalendarEntrance(-delta);
			return false;
		}
		var tempDate = new Date();
		var interval = tempDate.getTime() - lastMouseWheelDate.getTime();
		if(interval < mouseWheelInterval) return false;
		lastMouseWheelDate = tempDate;
		setCalendarEntrance(-delta);
		return false;
	});
	
	//点击了日历格子进行创建日期的动作
	$(".day-grid").click(function(event){
		clickedGrid = $(this);
		nowEditDate = new TimeZoneDate(clickedGrid.attr("id"));//更新当前所在更新的日期ID
		
		var showDateString = moment(nowEditDate).format("LL");
		$(".clicked-date").html(showDateString);
		
		showModalInContainer("#simple-edit","#simple-add-modal");
		clearForm($("#simple-add-modal"));
		$("#simple-add-modal").find("[name='begin-datetime']").val(nowEditDate);
		$("#simple-edit").position({
			of:clickedGrid,
			offset:"0 100",
			collision:"fit"
		});
	});
	
	//事件格子的点击
	$(".event-grid").click(function(){
		var dateId = $(this).parent().attr("id");
		var actId = $(this).attr('activity');
		var act = findActivityByDate(actId,dateId);
	
		var beginDateTime = new TimeZoneDate(act.fields.beginDateTime);
		var endDateTime = null;
		
		var titleDateTime = "";
		var endtitleDateTime = "~";
		
		if(act.fields.isWholeDay == true){
			titleDateTime = moment(beginDateTime).format("LL");
		}else{
			endDateTime = new TimeZoneDate(act.fields.endDateTime);
	
			titleDateTime = moment(beginDateTime).format("LLL");
			
			endtitleDateTime += moment(endDateTime).format("LLL");
			
		}

		showModalInContainer("#simple-edit","#simple-edit-modal");
		clearForm($("#simple-edit-modal"));
		
		//设置modal的界面元素
		var $form = $("#simple-edit-modal").find('#simple-edit-form');
		
		$form.find('[name=pk]').val(act.pk);
				
		$form.find('[name=begin-datetime]').val(beginDateTime.toISOString());
		
		$form.find("[name=is-whole-day]").val(act.fields.isWholeDay);
		
		$form.find('.clicked-date').html(titleDateTime);
		
		if(act.fields.isWholeDay == false){
			$form.find('[name=end-datetime]').val(endDateTime.toISOString());
			$form.find('.end-datetime').html(endtitleDateTime);
		}
		if(act.fields.title != null && act.fields.title != '')
			$form.find('[name=title]').val(act.fields.title);
		
		if(act.fields.content != null && act.fields.content != '')
			$form.find('[name=content]').val(act.fields.content);
			
		$("#simple-edit").position({
			of:$(this),
			offset:"0 100",
			collision:"fit"
		});
		return false;
	});
}
/*****************************************************
*简单编辑的相关事件处理
*****************************************************/
function dealWithSimpleEdit(){
	//回车事件的处理
	$("#simple-add-modal").keypress(function(e){
		if(e.keyCode == 13){
			$("#simple-submit").trigger("click");
			return false;
		}
		return true;
	});
	//创建新活动窗口的提交事件
	$("#simple-submit").click(function(){
		$("#simple-activity-form").ajaxSubmit(activitySubmitOption);
		hideModalInContainer("#simple-edit");
	});
	
	//简单的活动编辑窗口的提交事件
	$('#simple-update').click(function(){
		var pk = $("#simple-edit-form").find('[name=pk]').val();
		var dateId = $("#simple-edit-form")
			.find('[name=begin-datetime]').val();
			
		var act = findActivityByDate(pk,dateId);
		
		act.fields.title = $("#simple-edit-form").find('[name=title]').val();
		act.fields.content = $("#simple-edit-form").find('[name=content]').val();
		
		var dateToUpdate = new Date(dateId);
		
		if(act == null) return;
		$("#simple-edit-modal").find("form").ajaxSubmit(activitySubmitOption);
		
		return ;
	});
	
	//简单的活动编辑窗口的删除按钮的点击事件
	$("#simple-delete").click(function(){
		var pk = $("#simple-edit-form").find('[name=pk]').val();
		var beginDateString = $("#simple-edit-form")
			.find('[name=begin-datetime]').val()
		var act = findActivityByDate(pk,beginDateString);
		var dateToUpdate = new TimeZoneDate(beginDateString);
		if(act == null) return;
		var option = {};
		option = $.extend(option,activitySubmitOption);
		
		option['beforeSerialize'] = function($form,options){
			$form.find('[name=action]').val('delete');
		};
		option['afterSuccess'] = function(){
			refreshActivity('delete',pk);
		};
		$("#simple-edit-form").ajaxSubmit(option);
		
		return ;
	});
	
	$("button.edit-detail").on('click',function(){
		var jqForm = $(this).parents(".modal-content").find("form");

		switchContainer("#calendar-container","#activity-detail-container");
		clearForm($("#activity-detail-container"));
		getActivityDetailData(jqForm);
	});
}

/***********************************************************************************
*设置日历的入口函数
*action:int 传入的参数action表示将日历日期前进或后退几天，标准为当前日历显示的日期。
*action:string 格式为201103的日期8位字符,来直接确定要显示到哪一个月份
***********************************************************************************/
function setCalendarEntrance(action){
	//默认参数的用法
	if(typeof(action)=="undefined"){
		initializeDate();
		// setCalendar(calendarDate);
	}else if(typeof(action) == "number"){
		calendarDate.addMonths(action);
	}else if(typeof(action) == "string" && action.length == 6){
		var tempYear = action.substring(0,4);
		var tempMonth = action.substring(5,2);
		if(!Date.validateDay(1,tempYear,tempMonth)){
			return;
		}
		calendarDate.setYear(tempYear);
		calendarDate.setMonth(tempMonth);
	}
	showCalendar(setCalendar(calendarDate));
	getActivity(calendarDate,true,false);
}

/***********************************************************************************
*设置要在网页上的日历日期数组
*setDate:Date 表示要将界面日历设置为哪一个日期
***********************************************************************************/
function setCalendar(setDate){
	var dateArray = new Array();
	var firstDate = new TimeZoneDate(setDate);
	firstDate.moveToFirstDayOfMonth();
	var firstDay = firstDate.getDay();//获得当月的第一天为星期几

	var i,j;
	var minusNum = 0;	//需要减去的天数
	var dateN;	//用于暂存计算出来的日期
	var maxDay;
	//根据用户配置信息中所配置的第一天为周几来设置日期数组
	if(requiredInfo['userSetting'].fields.firstDayOfWeek == 1)
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
		if(dateN.getMonth() != setDate.getMonth()){
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
	//返回设置好的日期数组
	return dateArray;
}
/***********************************************************************************
*将计算出的日历显示到Html页面中去
*
***********************************************************************************/
function showCalendar(dateArray){
	var i,j;
	var monthRow,tableOfMonthRow,dayGrid;
	var dateString;
	var nowElement;
	var dateId;
	var todayId = nowDate.getDateId();
	//显示在界面上的日期元素
	var showDate = calendarDate;	
	var rowCount = setMonthFormat(dateArray.length);
	
	for(i=0;i<rowCount;i++){
		//获取每一行日历
		monthRow = $("#month .month-row:eq(" + i + ")");	//选取日期表格行
		tableOfMonthRow = monthRow.children(".month-row-table");
		for(j=0;j<7;j++){
			nowElement = i * 7 + j;		//当前日历上的元素序号
			
			dayGrid = tableOfMonthRow.find("td:eq(" + j + ")").children(".day-grid");	//选取日期单元格
			dayGrid.removeClass("today");
			
			dayGridTitle = dayGrid.children(".day-title");
			showDate = dateArray[nowElement];
			
			dateString = moment(showDate.date()).format("Do");
			dateId = showDate.getDateId();
			
			//设置“今天”格子的属性
			if(dateId == todayId){
				dayGrid.addClass("today");
			}
			//设置每一个日期单元格的内容和属性(id)
			dayGrid.attr("id",dateId);
			dayGridTitle.html(dateString);
			if(showDate.getMonth() != calendarDate.getMonth()){
				dayGridTitle.addClass("gray");
			}else{
				dayGridTitle.removeClass("gray");
			}	
		}
	}
	//设置每周第一天是哪一天
	if(requiredInfo['userSetting'].fields.firstDayOfWeek == 1)
		$("#weekday6").after($("#weekday0"));
	else 
		$("#weekday1").before($("#weekday0"));
		

	$("#now-date").html(moment(calendarDate.date()).format("L"));
}
/***********************************************************************************
*通过ajax获取当月所有的日历活动
***********************************************************************************/
function getActivity(setDate,beforeAndNext,cached){
	var dates = []

	if(isUndefined(beforeAndNext)) beforeAndNext = false;
	if(beforeAndNext){
		dates.push(setDate.clone().addMonths(-1).moveToFirstDayOfMonth().toISOString());
		dates.push(setDate.clone().addMonths(1).moveToLastDayOfMonth().toISOString());
		dates.push(setDate.toISOString());
	}else if(setDate instanceof Array){
		for(var i=0;i<setDate.length;i++)
			dates.push(setDate[i].toISOString());
	}else if(setDate instanceof Date){
		dates.push(setDate.toISOString());
	}else{
		return false;
	}
	
	//读取可选参数
	//强制刷新客户端数据
	if(!isUndefined(cached) || cached == true){
		for(var i=0;i<dates.length;i++){
			var monthId = dateIdToMonthId(dates[i]);
			if(!isUndefined(activity[monthId])){
				dates.splice(i,1);
				i--;
			}
		}
	}else{
		for(var i=0;i<dates.length;i++){
			var monthId = dateIdToMonthId(dates[i]);
			activity[monthId] = [];
		}
	}
	//进行查询
	if(dates.length != 0){
		$.ajax({url:"/calendar/getactivity/",
				data:JSON.stringify({"date":dates}),
				type:"post",
				async:false,
				success:function(data){
					for(var i=0;i<data['activity'].length;i++)
						hashActivity(data['activity'][i]);
				},
			});
	}
	showActivity();
}
/***********************************************************************************
*将查询到的活动显示到界面上
***********************************************************************************/
function showActivity(monthId){
	if(typeof(monthId) == UNDEFINED){
		monthId = calendarDate.getMonthId();
	}
	activityToShowArray();
	
	//清空原先的数据
	clearEventGrid();
	
	var dayGrids = $(".day-grid").not(".disable");
	
	
	for(var i=0;i<dayGrids.length;i++){
		var dayGrid = dayGrids.eq(i);
		var eventGrids = dayGrid.children(".event-grid");//显示活动的格子

		//获得月份和日期的Id
		var dateId = dayGrid.attr("id");
		var monthId = dateIdToMonthId(dateId);
		
		var moreCount = 1;
		var eventCount = 0;

		if(isUndefined(activity[monthId]) || isUndefined(activity[monthId][dateId]) ) 
			continue;
			
		for(var j=0;j<activity[monthId][dateId].length;j++){
			var isShown = false;
			act = activity[monthId][dateId][j];
			
			//总高度已高于日历格子高度
			if(canMoreEvent(dayGrid)){
				var $eventGrid = eventGrids.eq(eventCount);
				showNormalActivity(act,$eventGrid);
				eventCount += 1;
			}
			else{
				//还可以显示
				moreCount += 1;
			}
		}
		if(moreCount != 1)
			showMoreEvent(moreCount,dayGrid);
	}
}
/*****************************************************
*显示持续性事件
*****************************************************/
function showDurativeActivity(act,$eventGrid,$dayGrid,colCount){
	var dateId = $dayGrid.attr("id");
	var beginDateStr = new TimeZoneDate(act.fields.beginDateTime).getDateId();
	var endDateStr = new TimeZoneDate(act.fields.endDateTime).getDateId();
	
	showNormalActivity(act,$eventGrid);
	$eventGrid.addClass("many-days");
	$eventGrid.height(nowEventHeight);
	if(dateId == beginDateStr){
		$eventGrid.addClass("many-days-begin");
	}
	else if(dateId == endDateStr){
		$eventGrid.html("");
		$eventGrid.addClass("many-days-end");
	}
	else{
		if(colCount%7 != 0 && colCount%7 != 6){
			$eventGrid.html("");
			$eventGrid.addClass("many-days-line-in");
		}
	}
}
/*****************************************************
*判断某个事件格子是否正在使用
*****************************************************/
function isEventGridInUse($eventGrid){
	if($eventGrid.hasClass("in-use"))
		return true;
	if($eventGrid.hasClass("many-days"))
		return true;
	return false;
}
/*****************************************************
*判断总的事件格子是否已经超出了日历格子的高度
*****************************************************/
function canMoreEvent($dayGrid){
	var isUseCount = $dayGrid.find(".in-use,many-days").size() + 1;
	
	var nowHeight = ( (isUseCount + 1) * nowEventHeight );
	return nowHeight <= nowDayGridHeight;
}
/*****************************************************
*展示普通日历事项
*****************************************************/
function showNormalActivity(act,$eventGrid){
	var contentShort = act.content == "" 
						? '无内容'
						: getShort(act.fields.content);
						
	$eventGrid.addClass("in-use");
	$eventGrid.attr("activity",act.pk);
	$eventGrid.html(contentShort);
}
/*****************************************************
*展示”显示更多”的事件格子
*****************************************************/
function showMoreEvent(moreEventCount,$dayGrid){
	if(moreEventCount <= 0) return false;
	
	clearEventGrid($dayGrid.find(".in-use:last"));
	$dayGrid.find(".more-activity").html("更多的" + moreEventCount + "个活动");
}
/*****************************************************
*删除事件格子中的事件
*****************************************************/
function clearEventGrid($eventGrids){
	if(isUndefined($eventGrids))
		$eventGrids = $(".event-grid,.more-activity");
	$eventGrids.html("");
	$eventGrids.removeClass("in-use");
	$eventGrids.removeClass("many-days");
	$eventGrids.removeClass("many-days-begin");
	$eventGrids.removeClass("many-days-in");
	$eventGrids.removeClass("many-days-end");
}
/*****************************************************
*判断一个事件是否为持续性事件
*****************************************************/
function isDurativeActivity(act){
	if(act.fields.isWholeDay == false){
		var beginDateStr = new TimeZoneDate(act.fields.beginDateTime).getDateId();
		var endDateStr = new TimeZoneDate(act.fields.endDateTime).getDateId();
		if(beginDateStr != endDateStr)
			return true;
	}
	return false;
}
/************************************************************
*设置月日历的显示格式
*在显示日期界面时需要先调用这个函数来设置日历的行数等格式
************************************************************/
function setMonthFormat(dateCount){
	var rowCount = dateCount == 35 ? 5 : 6;	
	//根据行数来确定每一行的位置和高度
	var rowHeight;
	var rowTop;
	var monthRow = $("#month .month-row");
	var i = 0;
	//只需要5行显示的话则隐藏第6行
	if(rowCount == 5){
		$("#month .month-row:eq(5)").hide();
		$("#month .month-row:eq(5) .day-grid").addClass("disable"); 
		rowHeight = "20%";
		rowTop = ['0%','20%','40%','60%','80%','100%'];
		nowEventHeight = 18;
		nowDayGridHeight = 110;
	}else{
		$("#month .month-row:eq(5)").show();
		$("#month .month-row:eq(5) .day-grid").removeClass("disable");
		rowHeight = "16.6%";
		rowTop = ['0%','16.6%','33.2%','49.8%','66.4%','83%'];
		nowEventHeight = 18;
		nowDayGridHeight = 90;
	}
	monthRow.each(function(){
		$(this).css('top',rowTop[i]);
		$(this).css('height',rowHeight);
		i++;
	});
	return rowCount;
}
/************************************************************
根据传入参数获取仅仅包含年份及月份的字符串作为月份Id
************************************************************/
function dateIdToMonthId(d){
	return d.substring(0,7);
}

/***********************************************************************************
*刷新活动
***********************************************************************************/
function refreshActivity(action,act){
	var options = {};
	if(action == "add")	
		options['isDelete'] = false;
	if(action == 'update' || action == 'delete')
		options['isDelete'] = true;
	
	var pk = "";

	if(typeof(act) == 'string')
		pk = act;
	else if(!isUndefined(act.pk) && act.pk != null) 
		pk = act.pk;
	else 
		return false;
	findActivity(pk,options);
	
	if(action != 'delete')
		hashActivity(act);
		
	showActivity();
}


function showModalWithFocus(jqElement){
	jqElement.modal("show");
	focusOnFirst(jqElement);
}
/***********************************************************************************
*该函数在日历一开始加载的时候就必须运行
*从服务器获取日历显示一些必要的信息
***********************************************************************************/
function getRequiredInfo(){
	var result = true;
	var data;
	//20120410.暂时只获取日历本数据
	$.ajax({url:"/calendar/get/requiredinfo",
				type:"post",
				async:false,
				success:function(d){
					if(d['result'] == FAIL)
						result = false;
					else
						data = d;
				},
				error:function(){
					result = false;
				}
		});
	
	if(result == false){
		showTitleInfo(5,'获取用户信息失败','错误');
	}else{
		for(var key in data)
			requiredInfo[key] = data[key];
			
		initUserTimeZone(requiredInfo['tzOffset']);
	}
}
/*****************************************************
*根据用户的配置信息设置用户的时区
*****************************************************/
function initUserTimeZone(offset){
	TimeZoneDate.initTimeZoneOffset(offset);
}
/***********************************************************************************
*更新活动的函数 与服务器交互
***********************************************************************************/
function updateActivity(acts,action){
	var data = {'activity':acts};
	var result;
	var url;
	if(isUndefined(action) || action == 'new')
		data.action = 'new';
	else if(action == 'update')
		data.action = 'update';
	else if(action == 'delete')
		data.action = 'delete';
	//提交更新请求
	$.ajax({url:"/calendar/update/activity",
			data:JSON.stringify(data),
			type:"post",
			async:false,
			success:function(data){
				result = data['result'];
			},
	});
	return result;
}
/************************************************************
*将日历散列到数组当中去
************************************************************/
function hashActivity(act){
	var date = new TimeZoneDate(act.fields.beginDateTime).clearTime();
	var dateId = date.getDateId();
	var monthId = dateIdToMonthId(dateId);
	var ifExist = false;
	if(typeof(activity[monthId]) == UNDEFINED) activity[monthId] = [];
	if(typeof(activity[monthId][dateId]) == UNDEFINED) activity[monthId][dateId] = [];
	for(var i=0;i<activity[monthId][dateId].length;i++){
		if(activity[monthId][dateId][i].pk == act.pk){
			ifExist = true;
			activity[monthId][dateId][i] = act;
			break;
		}
	}
	if(!ifExist) activity[monthId][dateId].push(act);
	if(act.fields.isWholeDay == false){
		var beginDateTime = new TimeZoneDate(act.fields.beginDateTime).clearTime();
		var endDateTime = new TimeZoneDate(act.fields.endDateTime).clearTime();
		if(TimeZoneDate.compare(beginDateTime,endDateTime) != 0)
			durativeActivity.push(act);
		
	}

	sortActivity(activity[monthId][dateId]);
	

}
/*****************************************************
*获取活动显示的数组
*****************************************************/
function activityToShowArray(){
	activityToShow = {};
	var months = [];
	var dates = [];
	
	for(var month in activity){
		for(var date in activity[month]){
			for(var i=0;i<activity[month][date].length;i++){
				var act = activity[month][date][i];
				var beginDate = new TimeZoneDate(act.fields.beginDateTime).clearTime();
				var endDate = new TimeZoneDate(act.fields.endDateTime).clearTime();
				while(TimeZoneDate.compare(beginDate,endDate) <= 0){
					if(isUndefined(activityToShow[beginDate.getDateId()]))
						activityToShow[beginDate.getDateId()] = [];
					activityToShow[beginDate.getDateId()].push(act);
					beginDate.addDays(1);
				}
			}
		}
	}
}
/*****************************************************
*排序一个活动数组
*****************************************************/
function sortActivity(arr){
	arr.sort(function(act1,act2){
		var result1 = TimeZoneDate.compare(act1.fields.beginDateTime,act2.fields.beginDateTime);
		if (result1 != 0) 
			return result1;
		else{
			return (act1.pk - act2.pk)
		}
	});
}
/***********************************************************************************
*根据条件获取日程的函数组
***********************************************************************************/
//入口
function findActivity(id,options){
	if(isUndefined(options))
		options = {}
	if(isUndefined(options['isDelete'])){}
		
	if(!isUndefined(options['dateId'])) return findActivityByDate(id,options['dateId'],options['isDelete']);
	if(!isUndefined(options['monthId'])) return findActivityByMonth(id,options['monthId'],options['isDelete']);
	return findActivityByPk(id,options['isDelete']);
}
//1
function findActivityByPk(id,isDelete){
	for(var i in activity){
		act = findActivityByMonth(id,i,isDelete);
		if(act != null) return act;
	}
	return null;
}
//2
function findActivityByMonth(id,monthId,isDelete){
	if(isUndefined(activity[monthId])) return null;
	for(var i in activity[monthId]){
		act = findActivityByDate(id,i,isDelete);
		if(act != null) return act;
	}
	return null;
}
//3
function findActivityByDate(id,dateId,isDelete){
	dateId = new TimeZoneDate(dateId).getDateId();
	var monthId = dateIdToMonthId(dateId);
	if(!isUndefined(activity[monthId]) && !isUndefined(activity[monthId][dateId])){
		for(var i=0;i<activity[monthId][dateId].length;i++){
			var act = activity[monthId][dateId][i];
			if(act.pk == id){
				if(!isUndefined(isDelete) && isDelete == true){
					return activity[monthId][dateId].splice(i,1);
				}
				return act;
			}
		}
	}
	return null;
}
/************************************************************
*左边导航栏的设置函数
************************************************************/
function calendarLeftNavSet(){
	//设置边栏内的我的日历本相关
	$("#nav-my-book").children(".book:gt(0)").detach();
	if(!isUndefined(requiredInfo) && !isUndefined(requiredInfo['book'])){
		var books = requiredInfo['book'];
		for(var i=0;i<books.length;i++){
			var jqFirstBook = $("#nav-my-book").children(".book:first");
			var jqBook;
			if(jqFirstBook.find(".book-name").html() == ""){
				jqBook = jqFirstBook;
			}else{
				jqBook = $("#nav-my-book").children(".book:first").clone();
				$("#nav-my-book").children(".book:last").after(jqBook);
			}
			jqBook.find(".book-name").html(books[i].fields.name.sub(12));
			jqBook.find(".book-icon").addClass("icon-ok-sign");
		}
	}
}
/*****************************************************
*活动详细编辑的相关事件处理
*****************************************************/
function dealWithActivityDetail(){
	var jqContainer = $("#activity-detail-container");

	//日期选择的事件处理
	jqContainer.find("[name='is-whole-day']").click(function(){
		if($(this).attr("checked")=="checked"){
			jqContainer.find("[name='begin-date']")
										.siblings()
										.hide();
					
		}else{
			jqContainer.find("[name='begin-date']")
										.siblings()
										.show();
		}
	});
	
	jqContainer.find(".time").autocomplete({
		source:timeArray,
		minLength:0,
		delay:100,
	});
	
	jqContainer.find(".time").click(function(){
		$(this).autocomplete("search","");
	});	
	
	jqContainer.find("#activity-detail-back").click(function(){
		switchContainer(jqContainer,$("#calendar-container"));
	});
	
	jqContainer.find("#activity-detail-submit").click(function(){
		var result = false;
		var option = {};
		$.extend(option,activitySubmitOption);
		option['beforeSerialize'] = function($form,options){
			var beginDate = new TimeZoneDate($form.find("[name=begin-date]").val());
			
			if($form.find("[name='is-whole-day']").attr("checked") != "checked"){
				beginDate.setTime($form.find("[name=begin-time]").val());
				var endDateTime = new TimeZoneDate($form.find("[name=end-date]").val());
				endDateTime.setTime($form.find("[name=end-time]").val());
				$form.find("[name=end-datetime]").val(endDateTime);
			}
			$form.find("[name=begin-datetime]").val(beginDate);
		}
		jqContainer.find("form").ajaxSubmit(option);
		if(ajaxSubmitResult != null){
			if(ajaxSubmitResult['result'] == SUCCESS){
				switchContainer(jqContainer,"#calendar-container");
			}
		}
	});
}
/*****************************************************
*在启用详细编辑活动时抓取数据
*****************************************************/
function getActivityDetailData(jqForm){
	var jqContainer = $("#activity-detail-container");
	
	jqContainer.find("[name='begin-date']")
										.siblings()
										.hide();
										
	//用户日历本的设置
	var jqCalendarBook = jqContainer.find("select[name='calendar-book']");
	var calendarBooks = requiredInfo['book'];
	var valueField = 'pk';
	var contentField = 'fields.name';
	valueToSelect(jqCalendarBook,calendarBooks,valueField,contentField);

	//设置已有数据
	var dataObj = {};
	dataObj['title'] = jqForm.find("[name=title]").val();
	dataObj['content'] = jqForm.find("[name=content]").val();
	if(jqForm.find("[name='pk']").size() != 0){
		act = findActivityByPk(jqForm.find("[name='pk']").val());
		book = findObjectByPk(requiredInfo['book'],act.pk);
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
		dataObj['is-whole-day'] = act.fields.isWholeDay;
	}
	else{
		dataObj['begin-date'] = new TimeZoneDate(jqForm.find("[name=begin-datetime]").val()).getDateString();
		dataObj['begin-time'] = "00:00"; 
		dataObj['is-whole-day'] = true;
	}
	dataObjToForm(dataObj,jqContainer.find("form"));
}
/*****************************************************
*处理重复信息的相关设置
*****************************************************/
function dealWithRepeat(){
	$("[name='is-repeat']").click(function(){
		$("#activity-detail-modal").height('100px');
	});
}
/*****************************************************
*将给定的JS数组中的值根据给定的id字段和content字段赋值给Select元素
*****************************************************/
function valueToSelect(jqElement,dataArray,valueField,contentField){
	var option1 = "<option value='";
	var option2 = "'>";
	var option3 = "</option>";
	
	if(isUndefined(valueField))
		var valueField = "";
	if(isUndefined(contentField))
		var contentField = "";
		
	jqElement.html("");
	for(var i=0;i<dataArray.length;i++){
		var id = getObjectField(dataArray[i],valueField);
		var content = getObjectField(dataArray[i],contentField);
		content = getShort(content);
		var option = option1 + id + option2 + content + option3;
		jqElement.append(option);
	}
}

/*****************************************************
*将一个对象的值赋给一个表单的相应字段
*****************************************************/
function dataObjToForm(dataObj,jqForm){

	for(var key in dataObj){
		var data = dataObj[key];
		var jqElement ;
		if(typeof(data) == "boolean"){
			jqElement = jqForm.find("input[name=" + key + "][type=checkbox]");
			
			if(jqElement.attr("checked") == 'checked' && data == false)
				jqElement.trigger('click');
			else(jqElement.attr("checked") == '' && data == true)
				jqElement.trigger('click');
			
			jqElement.attr('checked',data);
		}
		else if(typeof(data) == "string" || typeof(data) == "number"){
			jqElement = jqForm.find("[name=" + key + "]");
			jqElement.val(data);
		}else if(data instanceof Date){
			jqElement = jqForm.find(".date-picker[name=" + key + "]");
			jqElement.datepicker("setDate",data);
		}
	}
	jqForm.find(".date-picker");
}

/*****************************************************
*切换主Container
*****************************************************/
function switchContainer($form,$to){
	$form = $($form);
	$to = $($to);
	$form.hide("drop",function(){
		$to.show("drop");
	});
}