Calendar.modal._$simpleEditModal = $("#simple-edit-modal");
Calendar.modal._$activityBroswer = $("#calendar-activity-broswer");

/*****************************************************
*显示简单编辑的窗口
*****************************************************/
Calendar.modal.showSimpleEdit = function(calendar,act,$position){
	var $modal = $("#simple-edit-modal");
	var $form = $modal.find("form:first");
	
	var beginDateTime = new TimeZoneDate(act.fields.beginDateTime);
	var endDateTime = new TimeZoneDate(act.fields.endDateTime);
	var titleDateTime = "";
	var endtitleDateTime = "~";
	
	if(act.fields.isWholeDay == true){
		titleDateTime = moment(beginDateTime).format("LL");
		
		endtitleDateTime += moment(endDateTime).format("LL")
	}else{

		titleDateTime = moment(beginDateTime).format("LLL");
		
		endtitleDateTime += moment(endDateTime).format("LLL");
		
	}
	showModal($modal,$position);
	focusOnFirst($modal);
	clearForm($modal);
	
	$form.find('.clicked-date').html(titleDateTime);
	$form.find('.end-datetime').html(endtitleDateTime);
	
	$form.find('[name=content]').val(act.fields.content);
	$form.find('[name=title]').val(act.fields.title);
	$form.find('[name=title]').val(act.fields.title);
	$form.find('[name=pk]').val(act.pk);
}


/*****************************************************
*显示modal来展示特定的活动列表
*****************************************************/
Calendar.modal.showActivityBroswer = function(calendar,beginDate,endDate){
	var acts = getActivityByDate(calendar._activityCache,beginDate,endDate);
	var $broswer = $("#calendar-activity-broswer");
	var $actTable = $broswer.find("table:first");
	var $trTemplate = Calendar.$t_trEventBroswer;
	$actTable.html("");
	for(var i=0;i<acts.length;i++){
		var $tr = $trTemplate.clone();
		var $td = $tr.children("td:first");
		
		$td.find(".event-content").text(getShort(acts[i].fields.content,30));

		if(acts[i].fields.isWholeDay == false){
			var beginDate = new TimeZoneDate(acts[i].fields.beginDateTime);
			$td.find(".event-time").text(moment(beginDate.date()).format("LT"));
		}
		$td.attr("activity",acts[i].pk);
		$actTable.append($tr);
	}
	showModal($broswer);
}