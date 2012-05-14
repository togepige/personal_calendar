CalendarObject = {};
//默认比较函数
CalendarObject.compare = function(obj1,obj2,fields){
	var val1 = getObjectField(obj1,fields);
	var val2 = getObjectField(obj2,fields);
	if(val1 == val2)
		return 0;
	else if(val1 > val2)
		return 1;
	else
		return -1;
}

function getObjectInArray(objs,field,val,isMultiple){
	if(isUndefined(isMultiple)){
		isMultiple = false;
	}
	var results = [];
	for(var i=0;i<objs.length;i++){
		if(getObjectField(objs[i],field) == val){
			if(isMultiple)
				results.push(objs[i]);
			else
				return objs[i];
		}
	}
	if(results.length !=0 )
		return results;
		
	return null;
}
function findAndUpdateObject(objs,field,val,obj,action){
	if(isUndefined(action))
		action = 'update';
	else if(action == 'add'){
		objs.push(obj);
		return obj;
	}
	
	for(var i=0;i<objs.length;i++){
		if(getObjectField(objs[i],field) == val){
			if(action == "delete"){
				objs.splice(i,1);
			}
			else
				objs[i] = obj;
			return objs[i];
		}
	}
	
	objs.push(obj);
	return obj;
}
/*****************************************************
*根据给定字段获取一个对象的某个字段值
*****************************************************/
function getObjectField(obj,field){
	if(isUndefined(field) || field == "")
		return obj;
	
	var fieldArray = field.split(".");
	var nowLevel = obj;
	for(var i=0;i<fieldArray.length;i++){
		nowLevel = nowLevel[fieldArray[i]];
	}
	return nowLevel;
}
/*****************************************************
*判断一个对象是否符合过滤条件
*****************************************************/
function isObjectShouldBeFilter(obj,filter){
	for(var i=0;i<filter.length;i++){
		var objVal = getObjectField(obj,filter[i].field);
		var filterVal = filter[i].val;
		if(filter[i].type == 'eq'){
			if(objVal != filterVal) return true;
		}
		if(filter[i].type == 'ne'){
			if(objVal == filterVal) return true;
		}
	}
	return false;
}

/*****************************************************
*进行客户端对象数据更新的方法
*****************************************************/
CalendarObject.update = function(target,objs,field,action,compareFunc){
	if(isUndefined(compareFunc) || typeof(compareFunc) != 'function')
		compareFunc = CalendarObject.compare;
	
	
	if(isUndefined(action))
		action = "updateOrNew";
	
	if(action == 'new'){
		target = target.concat(objs);
	}
	
	
	for(var i=0;i<objs.length;i++){
		var o = objs[i];
		var t = CalendarObject.getObject(target,o,field,false,compareFunc);
		if(t != null){
			var index = target.index(t);
			if(action == "update" || action == "updateOrNew"){
				target[index] = o;
			}else if(action == "delete"){
				target.splice(index,1);
			}	
		}else{
			if(action == "updateOrNew")
				target.push(o);
		}
	}
	
	return target;
}
/*****************************************************
*查找对象
*****************************************************/
CalendarObject.getObject = function(target,val,field,isMutiple,compareFunc){
	if(isUndefined(compareFunc) || typeof(compareFunc) != 'function')
		compareFunc = CalendarObject.compare;
	
	if(isUndefined(isMutiple))
		isMutiple = false;
	
	var results = [];
	for(var i=0;i<target.length;i++){
		if(compareFunc(target[i],val,field) == 0){
			if(isMutiple == true)
				results.push(target[i]);
			else 
				return target[i];
		}
	}
	if(isMutiple == false)
		return null;
	else
		return results;
}

/*****************************************************
*扩充Array功能，返回一个对象在数组中的引用
*****************************************************/
Array.prototype.index = function(obj,jsonFind){
	if(isUndefined(jsonFind))
		jsonFind = true;

	for(var i=0;i<this.length;i++){
		if(jsonFind == false){
			if(this[i] == obj)
				return i;
		}else{
			if(JSON.stringify(this[i]) == JSON.stringify(obj))
				return i;
		}
	}
	
	return -1;
}
