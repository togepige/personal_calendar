/*****************************************************
*扩充数组功能，判断某元素是否包含在数组内
*****************************************************/
Array.prototype.contain = function(obj){
	for(var i=0;i<this.length;i++){
		var val = this[i];
		if(val == obj)
			return true;
	}
	
	return false;
}