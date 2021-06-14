
console.log("STARTED");
const url = window.location.href + 'sync/';
// const thresh = 0.05
const thresh = 1.5

const vid = document.querySelector("video");
console.log(vid)
let video_playing = false;

let last_updated = 0

const vid_src = document.getElementById("running_src")


async function submit_handler(){
	try{
		youtube_url = document.getElementById("youtube_url").value
		res = await fetch(url + 'YoutubeStream/', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body:JSON.stringify({"url":youtube_url, "pafy":true})
		})
		if (res.ok){
			res = await res.json()
			console.log(`Successfully submitted - ${res.success}`)
		}
		else{
			throw "response did not have 200 status code"
		}
	}
	catch(err){
		console.log("%cYoutube URL submission failed", "color:red, font-size:20")
		console.log(err)
	}
}


function update_state(res){
	if (res.url !== vid_src.src){
		vid.pause()
		vid_src.setAttribute("src", res.url)
		vid.load()
		video_playing = false
		last_updated = 0
		return 
	}

	let current_global_timestamp = get_global_time();

	// the crux is that we'd like to adjust our timestamp only in the case when the video was running
	let proposed_time;
	if (res.paused){
		proposed_time = res.timestamp;
	}
	else{
		proposed_time = res.timestamp + (current_global_timestamp - res.global_time_to_sync_relative_video_tms);
	}
	console.log(`Get request showed a tms diff of ${(vid.currentTime - proposed_time)}s`)

	if (Math.abs(vid.currentTime - proposed_time) >= thresh){
		console.log(`You either drifted away or someone seeked the video, you were at ${vid.currentTime} and you received ${proposed_time}`)
		vid.currentTime = proposed_time;
	}
	else if(res.paused){
		// It will bring it to the exact timestamp even if they were nearby, might seem like an inconvenience to the user
		// Think about this again
		// usually this will bring the user back by a couple of frames/deciseconds (the one who did not cause the event, so its not that bad i guess?)
		if (vid.currentTime !== proposed_time){
			// because we dont want to trigger a seek event and update the last_update variable unnecessarily
			vid.currentTime = proposed_time; 

		}
	}

	// Do we need this block of code?
	// if (!res.paused){
	// 	video_playing = true;
	// }
	// else{
	// 	video_playing = false;
	// }

	if (!res.paused){
		vid.play();
	}
	else{
		vid.pause();
	}
}
function get_request_for_state(){
	console.log(`video paused - ${!video_playing}`)
	fetch(url)
	.then(res => {
		if (res.ok){
			console.log("get request was SUCCESSFUL");
			return res.json();
		}
		else{
			console.log("get request failed");
		}
	}).then(res => 
	{
		console.log(res);
		console.log(`%cDifference between update times on GET's response and local state is ${res.global_time_state_was_updated_at - last_updated}`,
			'color: green')
		if (res.global_time_state_was_updated_at > last_updated){
			update_state(res);
		}
		else{
			console.log("%cIgnored old state received from server", "color: blue; font-size:15px;");
		}
	}
	)
	.catch( error => { 
		console.log("%cGET could not be performed, threw an exception", "color: red");
		console.log(error)
	})
}
function post_request_for_state(){
	console.log(`video_playing variable is ${video_playing}`)
	let to_send = {
					timestamp: vid.currentTime,
					paused: !video_playing,
					global_time_state_was_updated_at: last_updated,
					global_time_to_sync_relative_video_tms: get_global_time()
				}
	console.log("making the post request ");
	console.log(to_send);
	fetch(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body:JSON.stringify(to_send)
	})
	.then(res => {
		if (res.ok){
			console.log("post request was SUCCESSFUL");
			return res.json();
		}
		else{
			console.log("post request failed");
		}
	}).catch( error => { 
		console.log("POST could not be performed, threw an exception");
	})
}

function log_pause(e){
	video_playing = false;
	console.log(vid.currentTime);
	last_updated = get_global_time();
	post_request_for_state();

}
function log_play(e){
	video_playing = true;
	console.log(`the video was played/resumed from ${vid.currentTime}`);
	last_updated = get_global_time();
	post_request_for_state();
}

// TIP - access the event object by adding it to the function signature
function log_seek(e){
	// last_updated = get_global_time();
	console.log(`You have jumped to the time ${vid.currentTime}`);
	post_request_for_state();

}

function log_seek_start(e){
	// fired as soon as a seek operation starts
	// therefore this function is always called before log_seek
	// we note last_updated here so that we can detect stale get responses early on
	last_updated = get_global_time();
	console.log(`last_updated is now ${last_updated}`)
	console.log(`You are trying to jump to the time ${vid.currentTime}`);
}

vid.onplay = log_play;
vid.onpause = log_pause;
vid.onseeked = log_seek;
vid.onseeking = log_seek_start;


let time_diff = 0;

function get_global_time(){
	let d = new Date();
	let t = d.getTime()/1000;
	return t + time_diff;
}

// the global time function in JS uses the local computer time which may be wrong
// we need a scynchronised global time to do a ton of stuff like account for network lag and decide which event happened later
// this function sets the time_diff used in turn by get_global_time
// this still does not account for the initial network lag - unsolvable?? unless we assume that everyones local times are already in sync and dont do this step
async function synchronise_time(){
	res = await fetch(url + 'time/')
	console.log(`res is here `)
	console.log(res)
	if (res.ok){
		res = await res.json() //res.json also returns a promise isliye hum pehle .then karte the
		time_diff = res.time - get_global_time()
	}
	console.log(`%cFound time diff to be ${time_diff}`, 'color: green; font-size:15px')
}


synchronise_time().catch(err => {
	console.log(`initial time sync failed due to ${err}`)
});


setInterval(get_request_for_state, 2000);

// https://simplernerd.com/js-youtube-seek/