// an attempt at trying to integrate youtube videos 
// currently its buggy since it doesnt take care that even after playing the YTplayer might go into the buffering state
// seek does not work when the video is paused
// cant change the youtube url



// base code borrowed from youtubes api docs - 
// https://developers.google.com/youtube/iframe_api_reference

console.log("STARTED");
const url = window.location.href + 'sync/';
const thresh = 1.5

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
let can_be_loaded = false;
let youtube_url = 'https://www.youtube.com/watch?v=SZ8HlNGMolw&ab_channel=Vox'
let last_updated = 0

// For the youtube parser
// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
// hasnt been tested yet
function url_to_id(url){
	console.assert(url !== null, "expected a non null url")
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

async function submit_handler(){
	try{
		youtube_url = document.getElementById("youtube_url").value
		// loadPlayer(youtube_url)
		if (!can_be_loaded){
			console.log("%cWAIT for the youtube library to import", "font-size: 20, color:red")
		}
		loadPlayer(youtube_url)
		res = await fetch(url + 'YoutubeStream/', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body:JSON.stringify({"url":youtube_url, "pafy": false})
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

function onYouTubeIframeAPIReady() {
	console.log("Waiting for the user to enter a url");
	can_be_loaded = true;
	// loadPlayer('SZ8HlNGMolw')
	loadPlayer(youtube_url)
	// loadPlayer('https://www.youtube.com/watch?v=djV11Xbc914&ab_channel=a-haa-haOfficialArtistChannel')
	// loadPlayer('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
}

function loadPlayer(given_url) {
	const vid_id = url_to_id(given_url)
	player = new YT.Player('youtube_video_player', {
		height: '390',
		width: '640',
		videoId: vid_id,
		playerVars: {
			'playsinline': 1
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	// event.target.playVideo();
	player.playVideo()
	console.log("Ready")

}

function update_state(res){
	if (res.url !== youtube_url){
		// vid.pause()
		console.log(`changed url from ${youtube_url} to ${res.url}`)
		// vid_src.setAttribute("src", res.url)
		youtube_url = res.url
		loadPlayer(youtube_url)
		// vid.load()
		// video_playing = false
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
	console.log(`Get request showed a tms diff of ${(player.getCurrentTime() - proposed_time)}s`)

	// if (Math.abs(vid.currentTime - proposed_time) >= thresh){
	if (Math.abs(player.getCurrentTime()  - proposed_time) >= thresh){
		console.log(`You either drifted away or someone seeked the video, you were at ${player.getCurrentTime()} and you received ${proposed_time}`)
		// vid.currentTime = proposed_time;
		player.seekTo(proposed_time);
	}
	else if(res.paused){
		// It will bring it to the exact timestamp even if they were nearby, might seem like an inconvenience to the user
		// Think about this again
		// usually this will bring the user back by a couple of frames/deciseconds (the one who did not cause the event, so its not that bad i guess?)
		if (player.getCurrentTime() !== proposed_time){
			// because we dont want to trigger a seek event and update the last_update variable unnecessarily
			// vid.currentTime = proposed_time; 
			player.seekTo(proposed_time);

		}
	}
	if (!res.paused){
		// vid.play();
		player.playVideo()
	}
	else{
		// vid.pause();
		player.pauseVideo()
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
	console.log(`video_playing variable is ${(player.getPlayerState() === 1)}`)
	let to_send = {
					timestamp: player.getCurrentTime(),
					paused: !(player.getPlayerState() === 1),
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

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
	// console.log("hi there, the state was changed")
	// triggered when a play pause happens
	// if (event.data == YT.PlayerState.PLAYING && !done) {
	// 	// setTimeout(stopVideo, 6000);
	// 	// done = true;
	// }
	const event_type = event.data 
	switch(event_type){
		case -1:
			console.log("unstarted")
			break
		case 0:
			console.log("ended?")
			break
		case 1:
			console.log("now in playing state")
			last_played = get_global_time();
			log_event()
			break
		case 2:
			console.log("now in paused state")
			log_event()
			break
		case 3:
			console.log("buffering")
			break
		case 5:
			console.log("cued up, wtf?")
			break
		default:
			console.log(`unidentified event - ${event_type}`)
			console.log(event)
	}
}

// player.getCurrentTime()

function log_event(){
	last_updated = get_global_time();
	post_request_for_state();
}
let time_diff = 0;

function get_global_time(){
	let d = new Date();
	let t = d.getTime()/1000;
	return t + time_diff;
}

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


// let last_played = 0;



// setTimeout(function detect_seek_and_handle(){
// 	right_now = get_global_time()
// 	let isSeek = true;
// 	if (last_played > last_detect_seek){
// 		isSeek = false
// 	}
// 	else if (player.getPlayerState() !== 1){
// 		isSeek = false
// 	}
// 	else if (last_detect_seek === right_now){
// 		isSeek = false
// 	}
// 	else{
// 		// handle seek
// 		console.log("seek event while paused")
// 		log_seek()
// 	}


// }, 2000)
