Calendar.auth = {};

Calendar.auth.$form = null;

Calendar.auth.isUnlocked = function($form){
	var sliderValue = $form.find(".slider-locker").slider("option","value");
	if(sliderValue > 95) 
		return true;
	
	return false;
}
//提交表单的选项
Calendar.auth.ajaxOption = {
	async:false,
	beforeSerialize:function($form,options){
		//检查是否解锁
		if(Calendar.auth.isUnlocked($form) == false){
			Calendar.tools.showInfo($form.find(".alert"),cnmsg.unlock);
			return false;
		}
		// 获取下一步所要跳转的URL，因为这个URL放置在GET参数中
		var nextURL = $.query.get("next");
		if(nextURL != null && nextURL != ""){
			$form.find("input[name=next]").val(nextURL);
	}
	},
	beforeSubmit:function(formDate,$form,options){
		
	},
	success:function(data){
		if(data['result'] == SUCCESS){
			location.href = data["nextURL"];
			return true;
		}
		else{
			Calendar.tools.showInfo(Calendar.auth.$form.find(".alert"),cnmsg[data['message']]);
		}
	},
	error:function(){
			Calendar.tools.showTitleInfo(cnmsg['serverError']);
	},
}

var gIfLogin = false;

var gNowPic = 1;
// 记录当前正在提交的表单的Id
var gFormId;

// 网页加载所作的操作
$(document).ready(function(){
	//初始化jquery元素
	if($("#login-form").size() != 0)
		Calendar.auth.$form = $("#login-form");
	else if($("#register-form").size() != 0)
		Calendar.auth.$form = $("#register-form");

	// 在网页加载时重置网页提示信息（包括滑动解锁条）
	$(".carousel").carousel({
		interval:4000
	});
	initMessage();
	doAfterInput();



	// 提交登录表单的操作
	$("#login-form").ajaxForm(Calendar.auth.ajaxOption);
	$("#register-form").ajaxForm(Calendar.auth.ajaxOption);
	
	
	$("#typehelper").autocomplete({
		source:function(request,response){
			var results = [];
			results.push(request.term+"@qq.com");
			results.push(request.term+"@163.com");
			response(results);
		},
	});
	$("#typehelper").bind("autocompletesearch", function(event, ui){
		console.log(event);
	});
});

function doAfterSubmit(message,a,b,c){
	// function(message){alert(message["result"]);
	// 未返回失败信息则该做什么做什么
	if(message["result"] != "fail") {
		location.href = message["nextURL"];
		return true;
	}
	// 出现错误，针对错误进行页面提示
	setMessage(message);
	resetSlider();
	return false;
}
// 根据返回值设置界面上的提示信息
function setMessage(message){
	errorType = message["type"];
	errorMessage = message["message"];
	var usernameElement = $(gFormId.jqString() + " input[name='username']:first");
	var passwordElements = $(gFormId.jqString() + " :password");
	passwordElements.val("");
	usernameElement.focus();
	// if(gFormId.name == "login-form"){
		// if(errorType == "username"){
			// usernameElement.focus();
		// }
		// else if(errorType == "password"){
			// passwordElements.eq(0).html("");
			// passwordElements.eq(0).focus();
		// }
	// }
	// else if(gFormId == "register-form"){
		// if(errorType == "username"){
			// usernameElement.focus();
		// }
		// else if(errorType == "password"){
			// passwordElements.eq(0).html("");
			// passwordElements.eq(1).html("");
			// passwordElements.eq(0).focus();
		// }
	// }
	$(gFormId.jqString() + " .alert span:first").html(cnmsg[errorMessage]);
	$(gFormId.jqString() + " .alert").show();
}
/*判断是否成功解锁
	return
		true:已经解锁
		false:未解锁
*/
function ifUnlock(formId){
	var sliderLocker = $(formId + " .slider-locker");
	var sliderValue;
	
	sliderValue = sliderLocker.slider("option","value");

	if(sliderValue > 95){
		return true;
	}
	else return false;
}
/*初始化所有界面提示信息
*/
function initMessage(){
	// $(".alert").hide();
}
/*重置滑动解锁条
*/
function resetSlider(){
	$(".slider-locker").slider("option","value","0");
}
/*登记用户输入后所要做的操作
*/
function doAfterInput(){
	$("input").focus(initMessage);
}

/*	自己实现的图片切换
function setIntroMain(){
	var allFig = $("#intromain").children();
	var first = allFig.first();
	var last = allFig.last();
	var now = first;
	var len = allFig.size();
	for(i=0;i<len;i++){
		if(now!=first) now.hide();
		if($(now).attr("id") != $(last).attr("id")){
			now.click(function(){
				$(this).effect("drop",function(){
					$(this).next().show();
				});
			});
		}else{
			now.click(function(){
				$(this).effect("drop",function(){
					$(first).show();
				});
			});
		}
		now = now.next();
	}
}
*/

