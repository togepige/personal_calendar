$(document).ready(function(){
	$(".hide-self").click(function(){
		$(this).hide();
	});

	$(".hide-modal").click(function(){
		$(this).closest(".modal").modal("hide");
	});
});