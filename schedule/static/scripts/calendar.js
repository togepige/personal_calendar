//全局变量
var gRequiredInfo = {};
var gCalendar;
var UserSetting = {};
$(document).ready(function(){

	getRequiredInfo();
	
	initCalendar();
	
	calendarLeftNavSet();
	
	$("#to-user-setting").click(function(){
		toContainer($("#user-setting"),function(){
			$("#user-setting-tab-nav a:first").tab('show');
		});
	});
	
	$("#to-calendar").click(function(){
		toContainer($("#calendar-main"));
	});
});

/*****************************************************
*初始化日历 
*****************************************************/
function initCalendar(){
	Calendar.init();
	gCalendar = new Calendar($("#calendar-container"),gRequiredInfo.today,gRequiredInfo);
}

/***********************************************************************************
*该函数在日历一开始加载的时候就必须运行
*从服务器获取日历显示一些必要的信息
***********************************************************************************/
function getRequiredInfo(){
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
		for(var key in data){
			gRequiredInfo[key] = data[key];
			
		}
		
		UserSetting.data = data['userSetting'];
		// initUserTimeZone(requiredInfo['tzOffset']);
		TimeZoneDate.initTimeZoneOffset(gRequiredInfo['tzOffset']);
	}
}

/************************************************************
*左边导航栏的设置函数
************************************************************/
function calendarLeftNavSet(){
	var $sideBarNav = $("#sidebar-nav");
	
	setLeftNavCalendarBook();
	
	$sideBarNav.on('click',".book",function(){
		var $book = $(this);
		var filter = {field:"fields.calendarBook",type:"ne",val:$(this).attr("calendar-book")};
		if($book.hasClass("disable")){
			gCalendar.removeFilter(filter);
			$book.removeClass("disable");
			$book.find(".book-name").removeClass("gray");
			$book.find(".book-icon:first").addClass("icon-ok-sign");
			$book.find(".book-icon:first").removeClass("icon-remove");
		}else{
			gCalendar.addFilter(filter);
			$book.addClass("disable");
			$book.find(".book-name").addClass("gray");
			$book.find(".book-icon:first").removeClass("icon-ok-sign");
			$book.find(".book-icon:first").addClass("icon-remove");
		}

		gCalendar.refreshActivity();
	});
}

/*****************************************************
*根据用户ID获取用户名
*****************************************************/
function getUsernameById(id){
	id = id + "";
	if(isUndefined(gRequiredInfo.user) == true){
		gRequiredInfo.user = {};
	}
	//查看缓存
	if(isUndefined(gRequiredInfo.user[id]) == false)
		return gRequiredInfo.user[id]
	//从服务器获取用户名
	
	$.ajax({url:"/calendar/get/username",
		type:"post",
		async:false,
		data:{id:id},
		success:function(d){
			if(d['result'] == SUCCESS)
				gRequiredInfo.user[id] = d['username']
		},
		error:function(){
		}
	});
	return gRequiredInfo.user[id];
}


function setLeftNavCalendarBook(){
	//设置边栏内的我的日历本相关
	if(!isUndefined(gRequiredInfo) && !isUndefined(gRequiredInfo['book'])){
		var books = gRequiredInfo['book'];
		var $bookTemplate = $("#nav-my-book").children(".book:first");
		$("#nav-my-book").children(".book").detach();
		$("#nav-subscribe").children(".book").detach();
		for(var i=0;i<books.length;i++){
			var $book = $bookTemplate.clone();
			$book.attr("calendar-book",books[i].pk);
			$book.find(".book-name").html(books[i].fields.name.sub(12));
			$book.find(".book-icon").addClass("icon-ok-sign");
			$("#nav-my-book").append($book);
		}
		
		for(var i=0;i<gRequiredInfo.subscribe.length;i++){
			var $book = $bookTemplate.clone();
			$book.attr("calendar-book",gRequiredInfo.subscribe[i].pk);
			$book.find(".book-name").html(gRequiredInfo.subscribe[i].fields.name.sub(12));
			$book.find(".book-icon").addClass("icon-ok-sign");
			$("#nav-subscribe").append($book);
		}
		
	}
}

function refreshAll(){
	gCalendar.refresh(gRequiredInfo);
	calendarLeftNavSet();
}

