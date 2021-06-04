
// document.getElementById("my_heading").innerText = "JS from a separate file"
// let count = 0

const url = window.location.href + 'sync/';
const thresh = 1.5
// const url = 'http://127.0.0.1:5000/sync/'
console.log("WORKING");

const vid = document.querySelector("video");
let video_playing = false;
console.log(vid);

function update_state(res){
	if (Math.abs(vid.currentTime - res.timestamp) >= thresh){
		// console.log(res)
		console.log(`You either drifted away or someone seeked the video, you were at ${vid.currentTime} and you received ${res.timestamp}`)
		
		if (!res.paused){
			video_playing = true;
		}
		else{
			video_playing = false;
		}

		vid.currentTime = res.timestamp;
	}
		if (!res.paused){
			vid.play();
		}
		else{
			vid.pause();
		}
}

function get_request_for_state(){
	fetch(url)
	.then(res => {
		if (res.ok){
			console.log("get request was SUCCESSFUL");
			return res.json();
		}
		else{
			console.log("get request failed");
		}
	}).then(update_state)
	.catch( error => { 
		console.log("Fetch could not be performed, threw an exception");
	})
}


function put_request_for_state(){
	fetch(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body:JSON.stringify({
					timestamp: vid.currentTime,
					paused: !video_playing
				})
	})
	.then(res => {
		if (res.ok){
			console.log("put request was SUCCESSFUL");
			return res.json();
		}
		else{
			console.log("put request failed");
		}
	}).catch( error => { 
		console.log("Fetch could not be performed, threw an exception");
	})
}


function log_pause(){
	video_playing = false;
	console.log("the video was paused");
	console.log(vid.currentTime);
	put_request_for_state();
}

function log_play(){
	// console.log("the video was played/resumed from ${vid.currentTime}");
	video_playing = true;
	console.log(`the video was played/resumed from ${vid.currentTime}`);
	put_request_for_state();	
}

function log_seek(){
	console.log(`You jumped to the time ${vid.currentTime}`);
	// ???
	put_request_for_state();
}

vid.onplay = log_play;
vid.onpause = log_pause;
vid.onseeked = log_seek;

setInterval( get_request_for_state, 1000);
