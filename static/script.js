
// Alternate JS file to load 

// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
// script.type = 'text/javascript';
// document.getElementsByTagName('head')[0].appendChild(script);


let myevent = jQuery.Event( "play", { isTrusted: false } );
jQuery("video").trigger(myevent, {isTrusted : false, hello : true});

vid = document.querySelector("video");

vid.onplay = function(e,a,b){
	// console.log(e,a,b)
	// console.log(e.hello)
	
} 

vid.onclick = function(e){
	console.log("yes, it worked", e.type)
	console.log(e)
}