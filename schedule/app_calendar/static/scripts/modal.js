$(document).ready(function(){
	initModal();

	cheatFunction();
	
	$(".hide-self").on('click',"",function(){
		$(this).parents(".modal").modal("hide");
	});
});

/***********************************************************************************
*偷懒函数
*1.由于JQuery的Position函数有问题，第一次显示会出错
*因此先用此函数在文档加载时进行一次无用的position操作，依次
*来保证之后操作的正确性。。。实在是找不出为什么在Chrome下第一次
*使用Position函数会出错啊。。。
***********************************************************************************/
function cheatFunction(){
	//1
	$(".modal").modal("show");
	$(".modal").position({
		of:$(document),
		offset:"-1000 -1100"
	});
	$(".modal").modal("hide");
}
/*****************************************************
*初始化所有modal
*****************************************************/
function initModal(){
	$(".modal").modal({show:false});
	$(".modal").draggable({handle:".modal-header,.modal-footer"});
}
/*****************************************************
*显示modal并且定位的函数
*****************************************************/
function showModal($modal,$position){
	$($modal).modal('show');
	if(!isUndefined($position)){
		var vOffset = $($modal).height();
		var hOffset = $($modal).width();
		$($modal).position({
			of:$($position),
			offset:hOffset/2 + " " + vOffset/2,
			collision:"fit"
		});
	}
	else{
		$($modal).position({
			of:$(document),
			collision:"fit"
		});
	}
}