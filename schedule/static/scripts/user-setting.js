
UserSetting._$main = $("#user-setting");
UserSetting._$template = {};
UserSetting._$template._$calendarBookRow = UserSetting._$main.find("#user-setting-template").find("tr.calendar-book-row");
UserSetting.nowEditBook = null;


//begin-日历本的相关数据
UserSetting.calendarBook = {};
UserSetting.calendarBook.$table = UserSetting._$main.find("#user-setting-calendar-book");
UserSetting.calendarBook.$subscribeTable = UserSetting._$main.find("#calendar-book-subscribe-table");

UserSetting.calendarBook.$trTemplate = UserSetting._$main.find("#user-setting-template").find("tr.calendar-book-row");
UserSetting.calendarBook.$subscribeTrTemplate = UserSetting._$main.find("#user-setting-template").find("tr.calendar-book-subscribe-row");

UserSetting.calendarBook.mapping = [
	{dataField:"fields.name",tdClass:'calendar-book-name',type:'link'},
	{dataField:"fields.user",tdClass:'calendar-book-createby',type:'text',option:{valueFunc:getUsernameById}},
	{dataField:null,tdClass:'calendar-book-show',type:'checkbox'},
];
//end-日历本的相关数据
//begin-授权信息的相关数据
UserSetting.calendarBookAuths = {};
UserSetting.calendarBookAuths.data = {};
UserSetting.calendarBookAuths.$table = UserSetting._$main.find("#calendar-book-auth-table");
UserSetting.calendarBookAuths.$trTemplate = UserSetting._$main.find("#user-setting-template").find("tr.calendar-book-auth-row");
UserSetting.calendarBookAuths.mapping = [
	{dataField:"fields.user",tdClass:'auth-username',type:'text',option:{valueFunc:getUsernameById}},
	{dataField:"fields.premission",tdClass:'auth-premission',type:'list',option:{listMapping:{"0":0,"1":1}}}
];
//end-授权信息的相关数据

UserSetting.publicBook = {};
UserSetting.publicBook.$trTemplate = UserSetting._$main.find("#user-setting-template").find("tr.public-calendar-book-row");
UserSetting.publicBook.$table = UserSetting._$main.find("#public-calendar-book-table");


$(document).ready(function(){
	$("#user-setting-nav-back").click(function(){
		switchContainer($("#user-setting"),$("#calendar-main"));
	});
	

	UserSetting.initTabEvent();
	
	UserSetting.initCalendarBookBroswerEvent();
	
	UserSetting.initCalendarBookDetailEvent();
	
	UserSetting.initCalendarBookAuthEvent();
	
	UserSetting.initCalendarBookImport();
	
	UserSetting.initBaseSetting();
});


/*****************************************************
*个人设置下tab切换及相关的事件处理
*****************************************************/
UserSetting.initTabEvent = function(){
	var $tab = this._$main.find("#user-setting-tab");
	
	UserSetting._$main.find("#user-setting-tab-nav a[data-toggle=tab]").on('show',function(e){
		$tabPane = $($(e.target).attr("data-target"));
		
		if($tabPane.attr("id") == "calendar-manage")
			UserSetting.onCalendarSettingShow($tabPane);
		
		if($tabPane.attr("id") == "base-setting")
			UserSetting.onBaseSettingShow($tabPane);
		return true;
	});
}
/*****************************************************
*切换到日历设置时的相关响应
*****************************************************/
UserSetting.onCalendarSettingShow = function($tabPane){
	toContainer($("#calendar-book-broswer"),false);
	UserSetting.refreshCalendarBook();
}
/*****************************************************
*基本设置界面显示时的事件响应
*****************************************************/
UserSetting.onBaseSettingShow = function(){
	var $form = $("#base-setting-form");
	$form.find("[name=first-day-of-week]").val(UserSetting.data.fields.firstDayOfWeek);
}
/*****************************************************
*基本设置提交的相关事件
*****************************************************/
UserSetting.initBaseSetting = function(){
	var ajaxOption = {
		async:false,
		beforeSerailize:function($form,options){
			var isChanged = false;
			if($form.find("[name=first-day-of-week]").val() != UserSetting.data.firstDayOfWeek)
				isChanged = true;
				
			
			return isChanged;
		},
		success:function(data){
			UserSetting.data = data['userSetting'];
			gRequiredInfo.userSetting = UserSetting.data;
			refreshAll();
		}
	}
	var $form = $("#base-setting-form"); 
	
	$form.ajaxForm(ajaxOption);
}
/*****************************************************
*编辑授权信息的界面的相关设置
*****************************************************/
UserSetting.initCalendarBookAuthEvent = function(){
	//进行了权限修改
	this._$main.find("#calendar-book-auth-table").on('click',' .auth-delete',function(){
		var $tr = $(this).closest("tr");
		UserSetting.calendarBookAuths.editAction.push({action:'delete',auth:$tr.attr("auth")});
		$tr.detach();
	});

	//添加新的日历本共享时的操作
	this._$main.find("#calendar-book-auth-form").on('click','#calendar-book-auth-new',function(){
		var username = $("#calendar-book-auth-form").find("[name=username]").val();
		var book = UserSetting.nowEditBook;
		var premission = $("[name=calendar-book-premission]").val();
		var canEdit = UserSetting.addNewCalendarBookauth(username,premission);
		if(canEdit){
			var editAction = {action:'new',username:username,premission:premission,book:book.pk};
			UserSetting.calendarBookAuths.editAction.push(editAction);
		}
	});
	
	//点击保存按钮时的操作
	this._$main.find("#calendar-book-auth").on('click',' .btn-save',function(){
		if(UserSetting.calendarBookAuths.editAction.length == 0)
			return;
		//ajax提交
		$.ajax({url:"/calendar/update/calendarbook/auth",
			type:"post",
			async:false,
			data:JSON.stringify({"data":UserSetting.calendarBookAuths.editAction}),
			success:function(d){
				//更新客户端数据
				var bookId = UserSetting.nowEditBook.pk;
				for(var i=0;i<UserSetting.calendarBookAuths.editAction.length;i++){
					var editAction = UserSetting.calendarBookAuths.editAction[i];
					if(editAction.action == 'delete'){
						findAndUpdateObject(UserSetting.calendarBookAuths.data[bookId],
											"pk",
											editAction.auth,
											null,
											'delete');
					}
					
				}
				for(var i=0;i<d['auths'].length;i++){
					findAndUpdateObject(UserSetting.calendarBookAuths.data[bookId],
											"pk",
											d['auths'][i].pk,
											d['auths'][i],
											'update');
				}
				
				UserSetting.calendarBookAuths.editAction = [];
			},
			error:function(){
				result = false;
			},
		});

		UserSetting.refreshCalendarAuthTable(UserSetting.nowEditBook.pk);
	});
	
	//取消事件的响应
	this._$main.find("#calendar-book-auth").on('click',' .btn-cancel',function(){
		toContainer($("#calendar-book-broswer"));
	});
}
/*****************************************************
*编辑详细界面的相关设置
*****************************************************/
UserSetting.initCalendarBookDetailEvent = function(){

	//点击新建日历本时的事件响应
	this._$main.find("#calendar-book-broswer").find("#calendar-book-nav-new").click(function(){
		UserSetting.nowEditBook = null;
		clearForm($("#calendar-book-detail"));
		toContainer($("#calendar-book-detail"));
	});
	
	this._$main.find("#calendar-book-detail").find("#calendar-book-detail-submit").click(function(){
		var result;
		//创建或修改日历本的表单提交的相关设置
		$("#calendar-book-detail-form").ajaxSubmit({
			url:"/calendar/update/calendarbook",
			type:'post',
			beforeSubmit:function(formData){
				//判断是新建日历本或者为更改日历本
				if(UserSetting.nowEditBook != null){
					formData.push({'name':'pk','value':UserSetting.nowEditBook.pk});
				}
			},
			success:function(data){
				if(data['result'] == SUCCESS){
					if(data['action'] == 'new')
						showTitleInfo(2,'创建了一个新的日历本','操作成功');
					else if(data['action'] == 'update')
						showTitleInfo(2,'更新一个新的日历本','操作成功');
					else if(data['action'] == 'delete')
						showTitleInfo(2,'删除一个新的日历本','操作成功');
					findAndUpdateObject(gRequiredInfo.book,"pk",data['book'].pk,data['book'],data['action']);
					UserSetting.refreshCalendarBook();
					toContainer($("#calendar-book-broswer"));
					setLeftNavCalendarBook();
				}
				else{
					showTitleInfo(-1,'操作失败，请重试','失败');
				}
			},
			error:function(data){
				showTitleInfo(-1,'操作失败，请重试','失败');
			}
		});

	});
	//点击返回按钮时的事件响应
	this._$main.find("#calendar-book-detail").find("#calendar-book-detail-back").click(function(){
		toContainer($("#calendar-book-broswer"));
	});
}
/*****************************************************
*进行刷新用户日历本的操作
*****************************************************/
UserSetting.refreshCalendarBook = function(){
	CalendarTable.showData(UserSetting.calendarBook.$table,
							UserSetting.calendarBook.$trTemplate,
							gRequiredInfo.book,
							UserSetting.calendarBook.mapping,
							{onRow:function($tr,book){
								$tr.attr("calendar-book",book.pk);
								}
							});
							
	CalendarTable.showData(UserSetting.calendarBook.$subscribeTable,
							UserSetting.calendarBook.$subscribeTrTemplate,
							gRequiredInfo.subscribe,
							UserSetting.calendarBook.mapping,
							{onRow:function($tr,book){
								$tr.attr("calendar-book",book.pk);
								}
							});
}
/*****************************************************
*浏览用户日历本的相关操作
*****************************************************/
UserSetting.initCalendarBookBroswerEvent = function(){
	//添加新的订阅时的操作
	this._$main.find("#calendar-book-nav-import").click(function(){
		toContainer($("#calendar-book-import"));
	});

	//删除操作
	this._$main.find("#user-setting-calendar-book").on('click','.calendar-book-row .calendar-book-delete',function(){
		var pk = $(this).closest(".calendar-book-row").attr('calendar-book');
		//创建或修改日历本的表单提交的相关设置
		$("#calendar-book-detail-form").ajaxSubmit({
			url:"/calendar/update/calendarbook",
			type:'post',
			beforeSubmit:function(formData){
				formData.push({'name':'pk','value':pk});
				formData.push({'name':'action','value':'delete'});
			},
			success:function(data){
				if(data['result'] == SUCCESS){
					showTitleInfo(2,'删除一个日历本','操作成功');
					findAndUpdateObject(gRequiredInfo.book,"pk",data['book'].pk,data['book'],'delete');
					UserSetting.refreshCalendarBook();
					setLeftNavCalendarBook();
				}
				else{
					showTitleInfo(-1,'操作失败，请重试','失败');
				}
			},
			error:function(data){
				showTitleInfo(-1,'操作失败，请重试','失败');
			}
		});
	});
	//共享设置的操作
	this._$main.find("#user-setting-calendar-book").on('click',' .calendar-book-auth-setting',function(){
		var bookId = $(this).closest(".calendar-book-row").attr('calendar-book');
		var book = getObjectInArray(gRequiredInfo.book,"pk",bookId);
		UserSetting.nowEditBook = book;
		UserSetting.getCalendarBookAuths(bookId);
		UserSetting.refreshCalendarAuthTable(bookId);
		UserSetting.calendarBookAuths.editAction = [];
		toContainer($("#calendar-book-auth"));
	});
	
	//详细编辑时的事件响应
	this._$main.find("#user-setting-calendar-book").on('click',".calendar-book-name",function(){
		toContainer($("#calendar-book-detail"));
		var pk = $(this).closest(".calendar-book-row").attr("calendar-book");
		UserSetting.nowEditBook = getObjectInArray(gRequiredInfo.book,"pk",pk);
		$("#calendar-book-detail").find("form:first").find("[name=name]").val(UserSetting.nowEditBook.fields.name);
		$("#calendar-book-detail").find("form:first").find("[name=introduction]").val(UserSetting.nowEditBook.fields.introduction);
		$("#calendar-book-detail").find("form:first").find("[name=createby]").text(getUsernameById(UserSetting.nowEditBook.fields.user));
	});
}

/*****************************************************
*从服务器获取特定日历本的授权信息
*****************************************************/
UserSetting.getCalendarBookAuths = function(bookId){
	if(!isUndefined(UserSetting.calendarBookAuths.data[bookId])) 
		return UserSetting.calendarBookAuths.data[bookId];
	
	var books = [];
	// for(var i=0;i<gRequiredInfo.book.length;i++){
		// books.push(gRequiredInfo.book[i].pk);
	// }
	books.push(bookId);
	
	$.ajax({url:"/calendar/get/calendarbook/auth",
		type:"post",
		async:false,
		data:JSON.stringify({"data":books}),
		success:function(d){
			if(d['result'] != SUCCESS)
				result = false;
			else
				UserSetting.calendarBookAuths.data[bookId] = d['bookAuths'];
		},
		error:function(){
			result = false;
		}
	});
}
/*****************************************************
*刷新授权表格的数据
*****************************************************/
UserSetting.refreshCalendarAuthTable = function(bookId){
	auths = UserSetting.getCalendarBookAuths(bookId);
	CalendarTable.showData(UserSetting.calendarBookAuths.$table,
						UserSetting.calendarBookAuths.$trTemplate,
						auths,
						UserSetting.calendarBookAuths.mapping,
						{onRow:function($tr,auth){
								$tr.attr("auth",auth.pk);
							},
						});
	
}

UserSetting.addCalendarauthLine = function(username,premission,authId){
	var $premissionTable = $("#calendar-book-auth-table");
	if($premissionTable.find("tbody tr:first").hasClass("empty-row")){
		$premissionTable.find("tbody").children().detach();
	}
	if($premissionTable.find(".auth-username").text() == username){
		return false;
	}
	
	var $templateRow = $("#user-setting-template .calendar-book-auth-row");
	
	var $row = $templateRow.clone();

	$row.find(".auth-username").text(username);
	if(premission == '0'){
		$row.find(".auth-premission").val("0");
	}else{
		$row.find(".auth-premission").val("1");
	}
	if(!isUndefined(authId)){
		$row.attr("auth",authId);
	}
	$premissionTable.find("tbody").append($row);
	return true;
}
/*****************************************************
*日历导入的相关设置
*****************************************************/
UserSetting.initCalendarBookImport = function(){
	$("#calendar-book-import").find(".btn-cancel").click(function(){
		toContainer($("#calendar-book-broswer"));
	});
	
	//点击订阅朋友的日历本时的事件
	$("#calendar-book-import-subscribe").click(function(){
		showModal($("#calendar-book-subscribe-modal"));
	});
	
	//产生订阅朋友日历时的事件响应
	$("#calendar-book-subscribe-modal form:first").keypress(function(e){
		if(e.keyCode == 13){
			$("#calendar-book-subscribe-modal .btn-ok").trigger("click");
			e.preventDefault();
		}
	});
	$("#calendar-book-subscribe-modal .btn-ok").click(function(){
		var username = $("#calendar-book-subscribe-modal").find("[name='username']").val();
		var result;
		var data = {"username":username};
		$.ajax({url:"/calendar/new/subscribe",
			type:"post",
			async:false,
			data:JSON.stringify(data),
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else{
					gRequiredInfo.subscribe = gRequiredInfo.subscribe.concat(d['book']);
					//进行日历本和活动的更新
					gCalendar.refreshCalendarBook(gRequiredInfo);
					UserSetting.refreshCalendarBook();
					setLeftNavCalendarBook();
					showTitleInfo(1,"成功导入一个日历本","操作成功");
					toContainer($("#calendar-book-broswer"));
				}
			},
			error:function(){
				result = false;
			}
		});
	});
	//取消订阅的事件
	$("#calendar-book-subscribe-table").on('click','.calendar-book-subscribe-delete',function(){
		var bookId = $(this).closest('tr').attr("calendar-book");
		var ajaxData = {pk:bookId};
		$.ajax({url:"/calendar/delete/subscribe",
			type:"post",
			async:false,
			data:JSON.stringify(ajaxData),
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else{
					findAndUpdateObject(gRequiredInfo.subscribe,
										"pk",
										bookId,
										null,
										'delete');
					
					//进行日历本和活动的更新
					setLeftNavCalendarBook();
					gCalendar.refreshCalendarBook(gRequiredInfo);
					UserSetting.refreshCalendarBook();
				}
			},
			error:function(){
				result = false;
			}
		});
	});
	
	//订阅公共日历本时的时间
	$("#calendar-book-import-public").click(function(){
		showModal($("#calendar-book-public-subscribe-modal"));
		UserSetting.publicBook.showPublicBook();
	});
	
	$("#public-calendar-book-table").on('click','.subscribe',function(){
		var $tr = $(this).closest("tr");
		var bookId = $tr.attr("calendar-book");
		var ajaxData = {"bookId":bookId};
		
		$.ajax({url:"/calendar/new/subscribe",
			type:"post",
			async:false,
			data:JSON.stringify(ajaxData),
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else{
					CalendarObject.update(gRequiredInfo.subscribeInfo,d['subscribe'],"pk");
					
					CalendarObject.update(gRequiredInfo.subscribe,d['book'],"pk");
					
					//进行日历本和活动的更新
					setLeftNavCalendarBook();
					gCalendar.refreshCalendarBook(gRequiredInfo);
					UserSetting.refreshCalendarBook();
					
					showTitleInfo(1,"成功导入一个日历本","操作成功");
					toContainer($("#calendar-book-broswer"));
				}
			},
			error:function(){
				result = false;
			}
		});
		
	});
}

/*****************************************************
*从服务器获取公共的日历本，并展示到界面上
*****************************************************/
UserSetting.publicBook.showPublicBook = function(){
	UserSetting.publicBook.data = [];
	
	UserSetting.publicBook.$table.children("tbody").empty();
	
	$.ajax({url:"/calendar/get/publicbook",
			type:"post",
			async:false,
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else{
					UserSetting.publicBook.data = d['book'];
				}
			},
			error:function(){
				result = false;
			}
	});
	
	for(var i=0;i<UserSetting.publicBook.data.length;i++){
		var book = UserSetting.publicBook.data[i];
		var subscribeInfo = getObjectInArray(gRequiredInfo.subscribeInfo,"fields.calendarBook",book.pk);
		var $row = UserSetting.publicBook.$trTemplate.clone();
		$row.find(".calendar-book-name").html(book.fields.name);
			
		if(subscribeInfo == null){
			$row.find(".action").children("subscribe").show();
			$row.find(".action").children("de-subscribe").hide();
		}else{
			$row.find(".action").children("subscribe").hide();
			$row.find(".action").children("de-subscribe").show();
		}
		
		$row.attr("calendar-book",book.pk);
		
		UserSetting.publicBook.$table.children("tbody").append($row);
	}
}


UserSetting.addNewCalendarBookauth = function(username,premission){
	return UserSetting.addCalendarauthLine(username,premission);
}