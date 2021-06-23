
const input_box = document.getElementById('youtube_url_box')
const submit_button = document.getElementById('button_url_update')
const vid = document.querySelector('video')
const vid_src = document.getElementById('running_src')
const socket = io(window.location.href)

// parameters 
// if the new tms is within this margin of the current tms, then the change is ignored for smoother viewing
const PLAYING_THRESH = 1 
const PAUSED_THRESH = 0.01

// Client's local state
let raw_url = null
let streamable_url = null
let video_playing = null
let last_updated = 0
let client_uid = null

//Clock synchronisation related variables
const num_time_sync_cycles = 10
let over_estimates = new Array()
let under_estimates = new Array()
let over_estimate = 0
let under_estimate = 0
let correction = 0



// button to enter new youtube url
submit_button.onclick =  (event) => {
	console.log(`You entered ${input_box.value}`)
	raw_url = input_box.value
	streamable_url = null
	input_box.value = ""	
	state_change_handler()
}

// connection event, sever sends a state update whenever a new connection is made
socket.on("connect", () => {
	console.log("Socket connection establised to the server")
})

// disconnection event
socket.on("disconnect", () => {
	console.log("got disconnected")
	client_uid = null
})


socket.on("state_update_from_server", (state) => {

	// Whenever the client connects or reconnects
	if (client_uid == null){
		client_uid = state.client_uid;
	}

	// someone changed the video
	if (vid_src.src !== state.streamable_url){
		vid.pause()
		raw_url = state.raw_url
		streamable_url = state.streamable_url
		vid_src.src = streamable_url 
		vid.load()
	} 

	// calculating the new timestamp for both cases - when the video is playing and when it is paused
	let proposed_time = (state.playing) ? ((state.video_timestamp - state.global_timestamp) + get_global_time(correction) ) : (state.video_timestamp)
	let gap = Math.abs(proposed_time - vid.currentTime)

	console.log(`%cGap was ${proposed_time - vid.currentTime}`, 'font-size:12px; color:purple')

	if (state.playing){
		if(gap > PLAYING_THRESH){
			// tolerance while the video is playing
			vid.currentTime = proposed_time
		}
		vid.play()
	}
	else{
		vid.pause()
		if (gap > PAUSED_THRESH){
			// condition to prevent an unnecessary seek
			vid.currentTime = proposed_time
		}
	}
})

let state_change_handler = (event) => {
	if (event !== null && event !== undefined){
		if (event.type === 'pause'){
			video_playing = false
		}
		else if (event.type === 'play'){
			video_playing = true
		}
	}
	last_updated = get_global_time(correction)
	state_image = {
		video_timestamp: vid.currentTime,
		last_updated: last_updated,
		playing: video_playing,
		global_timestamp: get_global_time(correction),
		raw_url : raw_url,
		streamable_url: streamable_url,
		client_uid: client_uid
	}
	socket.emit("state_update_from_client", state_image)
}

// assigning event handlers
vid.onseeking = state_change_handler
vid.onplay = state_change_handler
vid.onpause = state_change_handler

// handling the video ended case separately
vid.onended = () => {
	video_playing = false
	last_updated = get_global_time(correction)
	vid.load()
	state_change_handler()
}

function median(values){
	if(values.length === 0){
		return 0
	}
	values.sort((x,y) => (x-y));
	let half = Math.floor(values.length / 2);
	if (values.length % 2){
		return values[half];
	}
	return (values[half - 1] + values[half]) / 2.0;
}

function get_global_time(delta = 0){
	let d = new Date()
	let t = d.getTime()/1000
	// delta is the correction parameter
	return t + delta
}


let do_time_sync_one_cycle_backward = () => {
	socket.emit("time_sync_request_backward")
}
let do_time_sync_one_cycle_forward = () => {
	socket.emit("time_sync_request_forward", get_global_time(0))
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// time requests are made every second
let do_time_sync = async () => {
	for(let i = 0; i < num_time_sync_cycles; i++){
		await timeout(1000)
		do_time_sync_one_cycle_backward()
		await timeout(1000)
		do_time_sync_one_cycle_forward()
	}
}
do_time_sync()

socket.on("time_sync_response_backward", (time_at_server)=>{
	under_estimate_latest =  time_at_server - get_global_time(0)
	under_estimates.push(under_estimate_latest)	
	under_estimate = median(under_estimates)
	correction = (under_estimate + over_estimate)/2		
	console.log(`%c Updated val for under_estimate is ${under_estimate}`, "color:green")
	console.log(`%c New correction time is ${correction} seconds`, 'color:red; font-size:12px')
})

socket.on("time_sync_response_forward", (calculated_diff)=>{
	over_estimate_latest = calculated_diff
	over_estimates.push(over_estimate_latest)	
	over_estimate = median(over_estimates)
	correction = (under_estimate + over_estimate)/2		
	console.log(`%c Updated val for over_estimate is ${over_estimate}`, "color:green")
	console.log(`%c New correction time is ${correction} seconds`, 'color:red; font-size:12px')
})


