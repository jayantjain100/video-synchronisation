
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


let myfoo = async () =>{
	setTimeout(() => {console.log(1)}, 1000)
	console.log("inbetween")
	setTimeout(() => {console.log(2)}, 1000)
}
myfoo()

let myfoo2 = async () =>{
	await setTimeout(() => {console.log(1)}, 1000)
	console.log("inbetween")
	await setTimeout(() => {console.log(2)}, 1000)
}
myfoo2()