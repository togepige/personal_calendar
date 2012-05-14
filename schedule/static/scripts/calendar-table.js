CalendarTable = {};
CalendarTable.$emptyRow = $('<tr class="empty-row"><td colspan="20">无</td></tr>');
/*****************************************************
*简单的展示数据至表格的方法
*****************************************************/
CalendarTable.showData = function($table,$trTemplate,data,mapping,extend){
	var $tbody = $table.find("tbody:first");
	var colNum = mapping.length;
	var i=0,j=0;
	$tbody.empty();
	if(data.length == 0){
		$tbody.append(CalendarTable.$emptyRow.clone().attr('colspan',colNum+5));
	}
	
	//将每一个数据对象根据映射条件显示在界面上
	for(i=0;i<data.length;i++){
		var $tr = $trTemplate.clone();
		for(j=0;j<mapping.length;j++){
			var m = mapping[j];
			var dataValue = null;
			var trueArray = [];
			var listMapping = null;
			if(m.dataField != null){
				dataValue = getObjectField(data[i],m.dataField);
			}
			
			var tdClass = m.tdClass;
			var $td = $tr.children("."+tdClass);
			//查看是否要间接获取数据
			if(!isUndefined(m.option)){
				if(!isUndefined(m.option.valueFunc)){
					dataValue = m.option.valueFunc(dataValue);
				}
				if(!isUndefined(m.option[true])){
					trueArray = m.option[true];
				}
				if(!isUndefined(m.option.listMapping)){
					listMapping = m.option.listMapping
				}
			}
			
			if(m.type == "link"){
				$td.children("a:first").text(dataValue);
			}
			else if(m.type == "text"){
				$td.text(dataValue);
			}
			else if(m.type == "checkbox"){
				if(trueArray.contain(dataValue))
					$td.find(":checkbox").attr("checked",true);
			}else if(m.type == "list"){
				if(listMapping != null){
					var $list = $td.find("select:first");
					$list.val(listMapping[dataValue]);
				}
			}
		}
		
		if(!isUndefined(extend)){
			if(!isUndefined(extend.onRow)){
				extend.onRow($tr,data[i]);
			}
		}
		
		$tbody.append($tr);
	}
	
	return $table;
}