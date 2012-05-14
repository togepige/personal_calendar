

$(document).ready(function(){
	var $container = $("#calendar-activity-detail");
	
	//日期选择的事件处理
	$container.find("[name='c-is-whole-day']").click(function(){
		if($(this).attr("checked")=="checked"){
			$container.find("[name='begin-time']").hide();
			$container.find("[name='end-time']").hide();
					
		}else{
			$container.find("[name='begin-time']").show();
			$container.find("[name='end-time']").show();
		}
	});
	//重复类型中，周重复的相关事件
	$container.find("[name=repeat-type]").change(function(){
		var selectedItem = $(this).val();
		if(selectedItem == 'W'){
			$container.find(".controls .weekdays").show();
		}else{
			$container.find(".controls .weekdays").hide();
		}
	});
	
});
/*****************************************************
*显示编辑详细的界面
*****************************************************/
Calendar.activityDetail.showEditDetail = function(calendar,$form){
	Calendar.initDetailForm();
	
	Calendar.activityDetail.setActivityDetail(calendar,$form);
	
	
	
	switchContainer(calendar._$calendarDiv.children(".calendar:first"),$("#calendar-activity-detail"),function(){
		var $detail = $("#calendar-activity-detail");
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


/*****************************************************
*将已有的活动表单数据传送至详细编辑界面的表单
*****************************************************/
Calendar.activityDetail.setActivityDetail = function(calendar,$form){
	var jqContainer = $("#calendar-activity-detail");
	
	jqContainer.find("[name='begin-time']").hide();
	jqContainer.find("[name='end-time']").hide();
										
	//用户日历本的设置
	var jqCalendarBook = jqContainer.find("select[name='calendar-book']");
	var calendarBooks = calendar._requiredInfo['book'];
	var valueField = 'pk';
	var contentField = 'fields.name';
	valueToSelect(jqCalendarBook,calendarBooks,valueField,contentField);

	//设置已有数据
	var dataObj = {};
	dataObj['title'] = $form.find("[name=title]").val();
	dataObj['content'] = $form.find("[name=content]").val();
	if($form.find("[name='pk']").size() != 0){
		act = getObjectInArray(calendar._activityCache,"pk",$form.find("[name='pk']").val());

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
			var repeat = calendar.getRepeat(act);
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
	
	dataObjToForm(dataObj,jqContainer.find("form"));
}
/*****************************************************
*提交详细编辑的表单前需要设置的内容
*****************************************************/
Calendar.activityDetail.beforeSerialize = function($form,options){
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
}

Calendar.activityDetail.baseOption = {
	beforeSerialize:Calendar.activityDetail.beforeSerialize,
};

Calendar.activityDetail.submit = function(calendar){
	var option = $.extend(Calendar.activityDetail.baseOption,calendar._activitySubmitOption);
	calendar._$calendarDiv.find("#calendar-activity-detail").find("form:first").ajaxSubmit(option);
	calendar.switchToMonth();
}


Calendar.initDetailForm = function(){
	clearForm($("#activity-detail-form"));
	$("#activity-detail-form").find("[name=repeat-type]").val('D');
	$("#activity-detail-form").find("[name=repeat-interval]").val('1');
	$("#activity-detail-form").find(".weekdays").hide();
	$("#activity-detail-form").find(":checkbox").attr("checked",false);
	$("#activity-detail-form").find("[name-endtype]").attr("checked",true);
}

