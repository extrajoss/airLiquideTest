function helloMichael(){
	var content = document.getElementById("container").innerHTML;
	document.getElementById("container").innerHTML = content + "<br>Happy birthday!";
};

(function() {
	helloMichael();
})();
