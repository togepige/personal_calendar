Calendar.userSetting = {};
Calendar.userSetting.func = {};
Calendar.userSetting.event = {};

Calendar.userSetting.base = {};
Calendar.userSetting.base.func = {};
Calendar.userSetting.base.event = {};

Calendar.userSetting.$ = {};
Calendar.userSetting.$.main = $("#user-setting");
Calendar.userSetting.$.template = Calendar.userSetting.$.main.find("#user-setting-template");

Calendar.userSetting.calendarBook = {};
Calendar.userSetting.calendarBook.func = {};
Calendar.userSetting.calendarBook.event = {};
Calendar.userSetting.calendarBook.$ = {};
Calendar.userSetting.calendarBook.$.bookRowTemplate = Calendar.userSetting.$.template.find("tr.calendar-book-row");
Calendar.userSetting.calendarBook.$.subscribeRowTemplate = Calendar.userSetting.$.template.find("tr.calendar-book-subscribe-row");
Calendar.userSetting.calendarBook.$.calendarBookTable = Calendar.userSetting.$.main.find("#user-setting-calendar-book");
Calendar.userSetting.calendarBook.$.subscribeTable = Calendar.userSetting.$.main.find("#calendar-book-subscribe-table");

Calendar.userSetting.calendarBook.mapping = [
	{dataField:"fields.name",tdClass:'calendar-book-name',type:'link'},
	{dataField:"fields.user",tdClass:'calendar-book-createby',type:'text',option:{valueFunc:Calendar.func.getUsernameById}},
	{dataField:null,tdClass:'calendar-book-show',type:'checkbox'},
];

//begin-授权信息的相关数据
Calendar.userSetting.calendarBookAuths = {};
Calendar.userSetting.calendarBookAuths.data = {};
Calendar.userSetting.calendarBookAuths.$ = {};
Calendar.userSetting.calendarBookAuths.func = {};
Calendar.userSetting.calendarBookAuths.$.table = Calendar.userSetting.$.main.find("#calendar-book-auth-table");
Calendar.userSetting.calendarBookAuths.$.trTemplate = Calendar.userSetting.$.main.find("#user-setting-template").find("tr.calendar-book-auth-row");
Calendar.userSetting.calendarBookAuths.mapping = [
	{dataField:"fields.user",tdClass:'auth-username',type:'text',option:{valueFunc:Calendar.func.getUsernameById}},
	{dataField:"fields.premission",tdClass:'auth-premission',type:'list',option:{listMapping:{"0":0,"1":1}}}
];

Calendar.userSetting.calendarBookAuths.editAction = [];
//end-授权信息的相关数据

Calendar.userSetting.publicBook = {};
Calendar.userSetting.publicBook.$ = {};
Calendar.userSetting.publicBook.func = {};
Calendar.userSetting.publicBook.$.trTemplate = Calendar.userSetting.$.main.find("#user-setting-template").find("tr.public-calendar-book-row");
Calendar.userSetting.publicBook.$.table = Calendar.userSetting.$.main.find("#public-calendar-book-table");



$(document).ready(function(){
	for(var e in Calendar.userSetting.event)
		Calendar.userSetting.event[e]();
});


/*****************************************************
*个人设置下tab切换及相关的事件处理
*****************************************************/
Calendar.userSetting.event.initTabEvent = function(){
	var $tab = Calendar.userSetting.$.main.find("#user-setting-tab");
	
	Calendar.userSetting.$.main.find("#user-setting-tab-nav a[data-toggle=tab]").on('show',function(e){
		$tabPane = $($(e.target).attr("data-target"));
		
		if($tabPane.attr("id") == "calendar-manage")
			Calendar.userSetting.func.onCalendarSettingShow($tabPane);
		
		if($tabPane.attr("id") == "base-setting")
			Calendar.userSetting.func.onBaseSettingShow($tabPane);
		return true;
	});
}
/*****************************************************
*基本设置提交的相关事件
*****************************************************/
Calendar.userSetting.event.initBaseSetting = function(){
	$("#user-setting-nav-back").click(function(){
		toContainer($("#calendar-main"));
	});

	var ajaxOption = {
		async:false,
		beforeSerailize:function($form,options){
			var isChanged = false;
			if($form.find("[name=first-day-of-week]").val() != Calendar.models.userSetting.fields.firstDayOfWeek)
				isChanged = true;
				
			return isChanged;
		},
		success:function(data){
			Calendar.models.userSetting = data['userSetting'];
			Calendar.view.func.updateConfig();
		}
	}
	var $form = $("#base-setting-form"); 
	
	$form.ajaxForm(ajaxOption);
}
/*****************************************************
*浏览用户日历本的相关操作
*****************************************************/
Calendar.userSetting.event.initCalendarBookBroswerEvent = function(){
	//添加新的订阅时的操作
	Calendar.userSetting.$.main.find("#calendar-book-nav-import").click(function(){
		toContainer($("#calendar-book-import"));
	});

	//删除操作
	Calendar.userSetting.$.main.find("#user-setting-calendar-book").on('click','.calendar-book-row .calendar-book-delete',function(){
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
					// findAndUpdateObject(gRequiredInfo.book,"pk",data['book'].pk,data['book'],'delete');
					Objects.func.update(Calendar.models.calendarBook,data['book'],"pk",'delete');
					Calendar.activity.func.deleteFromCalendarBook(data['book']);
					Calendar.func.onCalendarBookChange();
					Calendar.userSetting.calendarBook.func.refreshCalendarBook();
					toContainer($("#calendar-book-broswer"));
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
	Calendar.userSetting.$.main.find("#user-setting-calendar-book").on('click',' .calendar-book-auth-setting',function(){
		var bookId = $(this).closest(".calendar-book-row").attr('calendar-book');
		var book = Objects.func.getObjectInArray(Calendar.models.calendarBook,"pk",bookId);
		Calendar.userSetting.nowEditBook = book;
		Calendar.userSetting.calendarBookAuths.func.getCalendarBookAuths(bookId);
		Calendar.userSetting.calendarBookAuths.func.refreshCalendarAuthTable(bookId);
		Calendar.userSetting.calendarBookAuths.editAction = [];
		toContainer($("#calendar-book-auth"));
	});
	
	//详细编辑时的事件响应
	Calendar.userSetting.$.main.find("#user-setting-calendar-book").on('click',".calendar-book-name",function(){
		toContainer($("#calendar-book-detail"));
		var pk = $(this).closest(".calendar-book-row").attr("calendar-book");
		Calendar.userSetting.nowEditBook = Objects.func.getObjectInArray(Calendar.models.calendarBook,"pk",pk);
		$("#calendar-book-detail").find("form:first").find("[name=name]").val(Calendar.userSetting.nowEditBook.fields.name);
		$("#calendar-book-detail").find("form:first").find("[name=introduction]").val(Calendar.userSetting.nowEditBook.fields.introduction);
		$("#calendar-book-detail").find("form:first").find("[name=createby]").text(Calendar.func.getUsernameById(Calendar.userSetting.nowEditBook.fields.user));
	});
}
/*****************************************************
*编辑详细界面的相关设置
*****************************************************/
Calendar.userSetting.event.initCalendarBookDetailEvent = function(){
	//点击新建日历本时的事件响应
	Calendar.userSetting.$.main.find("#calendar-book-broswer").find("#calendar-book-nav-new").click(function(){
		Calendar.userSetting.nowEditBook = null;
		clearForm($("#calendar-book-detail"));
		toContainer($("#calendar-book-detail"));
	});
	
	Calendar.userSetting.$.main.find("#calendar-book-detail").find("#calendar-book-detail-submit").click(function(){
		var result;
		//创建或修改日历本的表单提交的相关设置
		$("#calendar-book-detail-form").ajaxSubmit({
			url:"/calendar/update/calendarbook",
			type:'post',
			beforeSubmit:function(formData){
				//判断是新建日历本或者为更改日历本
				if(Calendar.userSetting.nowEditBook != null){
					formData.push({'name':'pk','value':Calendar.userSetting.nowEditBook});
				}
			},
			success:function(data){
				if(data['result'] == SUCCESS){
					if(data['action'] == 'new'){
						showTitleInfo(2,'创建了一个新的日历本','操作成功');
						Calendar.activity.func.invalidateCache();
					}
					else if(data['action'] == 'update')
						showTitleInfo(2,'更新一个新的日历本','操作成功');
					else if(data['action'] == 'delete')
						showTitleInfo(2,'删除一个新的日历本','操作成功');
					// findAndAndUpdateObject(gRequiredInfo.book,"pk",data['book'].pk,data['book'],data['action']);
					Objects.func.update(Calendar.models.calendarBook,data['book'],"pk",'update');
					Calendar.userSetting.calendarBook.func.refreshCalendarBook();
					
					toContainer($("#calendar-book-broswer"));
					Calendar.func.onCalendarBookChange();
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
	Calendar.userSetting.$.main.find("#calendar-book-detail").find("#calendar-book-detail-back").click(function(){
		toContainer($("#calendar-book-broswer"));
	});
}
/*****************************************************
*编辑授权信息的界面的相关设置
*****************************************************/
Calendar.userSetting.event.initCalendarBookAuthEvent = function(){
	//进行了权限修改
	Calendar.userSetting.$.main.find("#calendar-book-auth-table").on('click',' .auth-delete',function(){
		var $tr = $(this).closest("tr");
		Calendar.userSetting.calendarBookAuths.editAction.push({action:'delete',auth:$tr.attr("auth")});
		$tr.detach();
	});

	//添加新的日历本共享时的操作
	Calendar.userSetting.$.main.find("#calendar-book-auth-form").on('click','#calendar-book-auth-new',function(){
		var username = $("#calendar-book-auth-form").find("[name=username]").val();
		var book = Calendar.userSetting.nowEditBook;
		var premission = $("[name=calendar-book-premission]").val();
		Calendar.userSetting.calendarBookAuths.func.addNewCalendarBookAuth(username,premission);

		var editAction = {action:'new',username:username,premission:premission,book:book.pk};
		Calendar.userSetting.calendarBookAuths.editAction.push(editAction);
	});
	
	//点击保存按钮时的操作
	Calendar.userSetting.$.main.find("#calendar-book-auth").on('click',' .btn-save',function(){
		if(Calendar.userSetting.calendarBookAuths.editAction.length == 0)
			return;
		//ajax提交
		$.ajax({url:"/calendar/update/calendarbook/auth",
			type:"post",
			async:false,
			data:JSON.stringify({"data":Calendar.userSetting.calendarBookAuths.editAction}),
			success:function(d){
				//更新客户端数据
				var bookId = Calendar.userSetting.nowEditBook.pk;
				for(var i=0;i<Calendar.userSetting.calendarBookAuths.editAction.length;i++){
					var editAction = Calendar.userSetting.calendarBookAuths.editAction[i];
					if(editAction.action == 'delete'){
						// findAndUpdateObject(UserSetting.calendarBookAuths.data[bookId],
											// "pk",
											// editAction.auth,
											// null,
											// 'delete');
						Objects.func.update(Calendar.userSetting.calendarBookAuths.data[bookId],
											editAction.auth,
											"pk",
											"delete");
					}
					
				}
				for(var i=0;i<d['auths'].length;i++){
					var auth = d['auths'][i];
					// findAndUpdateObject(UserSetting.calendarBookAuths.data[bookId],
											// "pk",
											// d['auths'][i].pk,
											// d['auths'][i],
											// 'update');
					Objects.func.update(Calendar.userSetting.calendarBookAuths.data[bookId],
											auth,
											"pk",
											"update");
				}
				
				Calendar.userSetting.calendarBookAuths.editAction = [];
			},
			error:function(){
				result = false;
			},
		});

		Calendar.userSetting.calendarBookAuths.func.refreshCalendarAuthTable(Calendar.userSetting.nowEditBook.pk);
	});
	
	//取消事件的响应
	Calendar.userSetting.$.main.find("#calendar-book-auth").on('click',' .btn-cancel',function(){
		toContainer($("#calendar-book-broswer"));
	});
	
	Calendar.userSetting.$.main.find("#calendar-book-auth-form").keypress(function(e){
		if(e.keyCode == 13){
			$("#calendar-book-auth-form #calendar-book-auth-new").trigger("click");
			e.preventDefault();
		}
	});
}
/*****************************************************
*刷新授权表格的数据
*****************************************************/
Calendar.userSetting.calendarBookAuths.func.refreshCalendarAuthTable = function(bookId){
	var auths = Calendar.userSetting.calendarBookAuths.func.getCalendarBookAuths(bookId);

	Tables.func.showData(Calendar.userSetting.calendarBookAuths.$.table,
						Calendar.userSetting.calendarBookAuths.$.trTemplate,
						auths,
						Calendar.userSetting.calendarBookAuths.mapping,
						{onRow:function($tr,auth){
								$tr.attr("auth",auth.pk);
							},
						});
	
}
/*****************************************************
*从服务器获取特定日历本的授权信息
*****************************************************/
Calendar.userSetting.calendarBookAuths.func.getCalendarBookAuths = function(bookId){
	if(!isUndefined(Calendar.userSetting.calendarBookAuths.data[bookId])) 
		return Calendar.userSetting.calendarBookAuths.data[bookId];
	
	var books = [];

	books.push(bookId);
	
	$.ajax({url:"/calendar/get/calendarbook/auth",
		type:"post",
		async:false,
		data:JSON.stringify({"data":books}),
		success:function(d){
			if(d['result'] != SUCCESS)
				result = false;
			else
				Calendar.userSetting.calendarBookAuths.data[bookId] = d['bookAuths'];
		},
		error:function(){
			result = false;
		}
	});
	return Calendar.userSetting.calendarBookAuths.data[bookId];
}
/*****************************************************
*切换到日历设置时的相关响应
*****************************************************/
Calendar.userSetting.func.onCalendarSettingShow = function($tabPane){
	toContainer($("#calendar-book-broswer"),false);
	Calendar.userSetting.calendarBook.func.refreshCalendarBook();
}
/*****************************************************
*基本设置界面显示时的事件响应
*****************************************************/
Calendar.userSetting.func.onBaseSettingShow = function(){
	var $form = $("#base-setting-form");
	$form.find("[name=first-day-of-week]").val(Calendar.models.userSetting.fields.firstDayOfWeek);
}

/*****************************************************
*进行刷新用户日历本的操作
*****************************************************/
Calendar.userSetting.calendarBook.func.refreshCalendarBook = function(){
	var books = Objects.func.getObject(Calendar.models.calendarBook,null,null,true,function(obj1,obj2){
		var sub = Objects.func.getObject(Calendar.models.subscribe,obj1.pk,"fields.calendarBook");
		if(sub == null)
			return 0;
		return 1;
	});
	
	var subscribes = Objects.func.getObject(Calendar.models.calendarBook,null,null,true,function(obj1,obj2){
		var sub = Objects.func.getObject(Calendar.models.subscribe,obj1.pk,"fields.calendarBook");
		if(sub != null)
			return 0;
		return 1;
	});	

	Tables.func.showData(Calendar.userSetting.calendarBook.$.calendarBookTable,
							Calendar.userSetting.calendarBook.$.bookRowTemplate,
							books,
							Calendar.userSetting.calendarBook.mapping,
							{onRow:function($tr,book){
								$tr.attr("calendar-book",book.pk);
								}
							});
							
	Tables.func.showData(Calendar.userSetting.calendarBook.$.subscribeTable,
							Calendar.userSetting.calendarBook.$.subscribeRowTemplate,
							subscribes,
							Calendar.userSetting.calendarBook.mapping,
							{onRow:function($tr,book){
								$tr.attr("calendar-book",book.pk);
								}
							});
}
/*****************************************************
*添加一行新的授权信息
*****************************************************/
Calendar.userSetting.calendarBookAuths.func.addNewCalendarBookAuth = function(username,premission,authId){
	var $premissionTable = $("#calendar-book-auth-table");
	if($premissionTable.find("tbody tr:first").hasClass("empty-row")){
		$premissionTable.find("tbody").children().detach();
	}
	if($premissionTable.find(".auth-username").text() == username){
		return false;
	}
	
	var $templateRow = Calendar.userSetting.calendarBookAuths.$.trTemplate;
	
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
Calendar.userSetting.event.initCalendarBookImport = function(){
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
					Calendar.models.calendarBook = Calendar.models.calendarBook.concat(d['book']);
					Calendar.models.subscribe = Calendar.models.subscribe.concat(d['subscribe']);
					Calendar.activity.func.invalidateCache();
					//进行日历本和活动的更新
					Calendar.func.onCalendarBookChange();
					
					Calendar.userSetting.calendarBook.func.refreshCalendarBook();

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
					// findAndUpdateObject(gRequiredInfo.subscribe,
										// "pk",
										// bookId,
										// null,
										// 'delete');
					
					Objects.func.update(Calendar.models.calendarBook,bookId,"pk",'delete');
					Calendar.activity.func.deleteFromCalendarBook(bookId);
					//进行日历本和活动的更新
					Calendar.func.onCalendarBookChange();
					Calendar.userSetting.calendarBook.func.refreshCalendarBook();
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
		Calendar.userSetting.publicBook.func.showPublicBook();
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
					Objects.func.update(Calendar.models.subscribe,d['subscribe'],"pk");
					Objects.func.update(Calendar.models.calendarBook,d['book'],"pk");
					Calendar.activity.func.invalidateCache();
					//进行日历本和活动的更新
					Calendar.func.onCalendarBookChange();
					Calendar.userSetting.calendarBook.func.refreshCalendarBook();
					
					showTitleInfo(1,"成功导入一个日历本","操作成功");
					// toContainer($("#calendar-book-broswer"));
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
Calendar.userSetting.publicBook.func.showPublicBook = function(){
	Calendar.userSetting.publicBook.data = [];
	
	Calendar.userSetting.publicBook.$.table.children("tbody").empty();
	
	$.ajax({url:"/calendar/get/publicbook",
			type:"post",
			async:false,
			success:function(d){
				if(d['result'] != SUCCESS)
					result = false;
				else{
					Calendar.userSetting.publicBook.data = d['book'];
				}
			},
			error:function(){
				result = false;
			}
	});
	
	for(var i=0;i<Calendar.userSetting.publicBook.data.length;i++){
		var book = Calendar.userSetting.publicBook.data[i];
		var subscribeInfo = Objects.func.getObjectInArray(Calendar.models.subscribe,"pk",book);
		var $row = Calendar.userSetting.publicBook.$.trTemplate.clone();
		$row.find(".calendar-book-name").html(book.fields.name);
			
		if(subscribeInfo == null){
			$row.find(".action").children("subscribe").show();
			$row.find(".action").children("de-subscribe").hide();
		}else{
			$row.find(".action").children("subscribe").hide();
			$row.find(".action").children("de-subscribe").show();
		}
		
		$row.attr("calendar-book",book.pk);
		
		Calendar.userSetting.publicBook.$.table.children("tbody").append($row);
	}
}


