Calendar.modal = {};
Calendar.modal.func = {};
Calendar.modal.$ = {};
Calendar.modal.$.simpleEditModal = $("#simple-edit-modal");
Calendar.modal.$.activityBroswer = $("#calendar-activity-broswer");

/*****************************************************
*显示简单编辑的窗口
*****************************************************/
Calendar.modal.func.showSimpleEdit = function(act,$position){
	var canEdit = Calendar.activity.func.canEdit(act);
	Calendar.modal.setEditModal(canEdit);
	
	var $modal = Calendar.modal.$.simpleEditModal;
	
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
Calendar.modal.func.showActivityBroswer = function(beginDate,endDate){
	var acts = Calendar.activity.func.getActivityByDate(beginDate,endDate);
	var $broswer = $("#calendar-activity-broswer");
	var $ul = $broswer.find("ul:first");
	
	var $trTemplate = Calendar.view.$.eventBroswerRowTemplate;
	$ul.html("");
	
	for(var i=0;i<acts.length;i++){
		var act = acts[i];
		var $row = $trTemplate.clone();
		var beginDate = new TimeZoneDate(act.fields.beginDateTime);
		var date;
		var content = getShort(act.fields.content,30);
		if(content == "")
			content = "无内容";
		$row.children(".activity-content").text(content);
		if(acts[i].fields.isWholeDay == false)
			date = moment(beginDate.date()).format("LL");
		else
			date = moment(beginDate.date()).format("LLL");
		$row.children(".activity-date").text(date);
		$row.attr("activity",acts[i].pk);
		$ul.append($row);
	}
	showModal($broswer);
}

Calendar.modal.setEditModal = function(canEdit){
	var $modal = Calendar.modal.$.simpleEditModal;
	if(canEdit == true){
		$modal.find(".modal-title").text("活动修改");
		$modal.find(".activity-delete,.edit-detail,#simple-update").show();
		$modal.find(".btn-close").hide();
	}
	else{
		$modal.find(".modal-title").text("活动查看");
		$modal.find(".activity-delete,.edit-detail,#simple-update").hide();
		$modal.find(".btn-close").show();
	}
}