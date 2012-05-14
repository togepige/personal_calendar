/*****************************************************
*将焦点移至第一个可输入的表单元素上
*****************************************************/
function focusOnFirst($jqElement){
	$($jqElement).find("input:visible:first").focus();
}
/*****************************************************
*清空表单
*****************************************************/
function clearForm($element){
	try{
		if($($element).is("form"))
			$($element).resetForm();
		else
			$($element).find("form").resetForm();
	}
	catch(err){
		return;
	}
	return;
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