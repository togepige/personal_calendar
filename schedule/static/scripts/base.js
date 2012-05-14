var Calendar = {};
Calendar.tools = {};
var SUCCESS = 'success';
var UNDEFINED = 'undefined';
var FAIL = 'fail';
var titleTimeout;
/************************************************************
*判断一个变量是否未定义
************************************************************/
function isUndefined(ele){
	if(typeof(ele) == UNDEFINED) return true;
	if(ele == null)
		return true;
	
	return false;
}

//ajaxSend添加csrf头部
jQuery(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});
/**************************************/
$(document).ready(function(){

	$("#title-info").click(function(){
		$(this).hide();
		clearTimeout(titleTimeout);
	});
	
	$(".close").click(function(){
		if($(this).hasClass("modal-close"))
			$($(this).attr("close")).modal("hide");
		else
			$($(this).attr("close")).hide();
	});
	
	
	
	$(".slider").slider({
		max:100,
		animate:true
	});
	
	$(".tab-link").click(function(){
		if($(this).hasClass("unselected"))
			switchSelected($(this));
	});

	$(".collapse").collapse({toggle:false});
	

	
	dealWithDatePicker();
});
/*****************************************************
*日期选择器的相关事件处理
*****************************************************/
function dealWithDatePicker(){
	$(".date-picker").datepicker(zhcnOption);
}

function showTitleInfo(second,message,title){
	if(!isUndefined(title)) $("#title-info strong").html(title + ":");
	$("#title-info span").html(message);
	$("#title-info").show();
	if(!isUndefined(titleTimeout)) 
		clearTimeout(titleTimeout);
	if(second == -1){
		return true;
	}
	titleTimeout = setTimeout(function(){
			$("#title-info").hide();
		},
		second*1000
	);
}

/***********************************************************************************
*切换选中及未选中的元素的状态
*element:jQuery对象 代表要被选中的对象
***********************************************************************************/
function switchSelected(element){
	selectedElement = element.parent().children(".selected");	
	
	var prevTabId = selectedElement.attr("tab");
	$(prevTabId).hide();
	var nowtabId = element.attr("tab");
	$(nowtabId).show(focusOnFirst($(this)));
	//更改选中元素的状态
	selectedElement.removeClass("selected");
	selectedElement.addClass("unselected");
	element.removeClass("unselected");
	element.addClass("selected");
}


/*****************************************************
*切换主Container
*****************************************************/
function switchContainer($form,$to,callable){
	$form = $($form);
	$to = $($to);
	if($to.is(":visible")){
		return ;
	}
	$form.hide("drop",600,function(){
		$to.show("drop",{direction:"right"},600,function(){
			if(!isUndefined(callable))
				callable();
		});
	});
}

function toContainer($container,arg1,arg2){
	var callable;
	var animate = true;
	if(!isUndefined(arg1)){
		if(!isUndefined(arg2)){
			callable = arg1;
			animate = arg2;
		}
		else{
			if(typeof(arg1) == 'function'){
				callable = arg1;
			}else{
				animate = arg1;
			}
		}
	}
	
	var $new = $($container);
	var group = $new.attr("container-group");
	var index = $new.attr("container-index");
	if(isUndefined(index)) index=1;
	if($new.hasClass("active") && $new.is(":visible")) return true;
	
	var $old = $new.siblings('[container-group=' + group + '].active');
	if($old.size() == 0){
		$old = $new.siblings('[container-group=' + group + ']:visible:first');
	}
	var oldIndex = $old.attr("container-index");
	if(isUndefined(oldIndex)) oldIndex=1;
	var oldOption = {};
	var newOption = {};
	if(index < oldIndex){
		oldOption['direction'] = 'right';
		newOption['direction'] = 'left';
	}
	else{
		oldOption['direction'] = 'left';
		newOption['direction'] = 'right';
	}
	if(animate == true){
		$old.hide('drop',oldOption,500,function(){
			$new.show('drop',newOption,500,function(){
				if(!isUndefined(callable))
					callable();
			
			});
		});
	}
	else{
		$old.hide();
		$new.show();
	}
	
	$old.removeClass("active");
	$new.addClass("active");
	if(!isUndefined(callable))
		callable();
}
/*****************************************************
*增强String的功能
*****************************************************/
String.prototype.len = function(){
	return this.replace(/[^\x00-\xff]/g,"rr").length;
}

String.prototype.sub = function(n)
{    
	var r = /[^\x00-\xff]/g;    
	if(this.replace(r, "mm").length <= n) return this+"";   
	// n = n - 3;    
	var m = Math.floor(n/2);    
	for(var i=m; i<this.length; i++){    
		if(this.substr(0, i).replace(r, "mm").length>=n) {    
			return this.substr(0, i)+""; 
		}    
	}
	return this+"";   
};

/***********************************************************************************
*jqElement对象
***********************************************************************************/
function JQElement(type,name){
	this.type = type;
	this.name = name;
	return this;
}
JQElement.prototype.jqString = function(){
	return this.type + this.name;
}

JQElement.prototype.jqElement = function(){
	return $(this.jqString);
}

function getShort(str,len){
	if(isUndefined(len))
		var len = 14;
	if(str.len() < len)
		return str;
	else{
		return str.sub(len) + "...";
	}
}

function toPercent(num){
	return (num * 100) + '%';
}

Calendar.tools.showInfo = function($div,info,seconds){
	$div.find(".alert-content").text(info);
	$div.show();
}

Calendar.tools.showTitleInfo = function(info,seconds){
	showTitleInfo(isUndefined(seconds)?-1:seconds,info)
}



