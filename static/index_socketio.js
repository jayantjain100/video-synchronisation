
// for learning purposes first ill try to write a chat message thing
console.log("Entered the JS script")

// How do we alter DOM objects?

const input_box = document.getElementById('youtube_url_box')
const submit_button = document.getElementById('button_url_update')

// const vid = document.createElement('video')
// vid.muted = true //(For autoplay)
// const vid_src = document.createElement('source')
// vid.appendChild(vid_src)

const vid = document.querySelector('video')
const vid_src = document.getElementById('running_src')

console.log(input_box)
console.log(submit_button)
// const socket = io("http://127.0.0.1:5000/")
const socket = io(window.location.href)

let raw_url = null
let streamable_url = null
let video_playing = null
let last_updated = 0
let client_uid = null

submit_button.onclick =  (event) => {
	console.log(`You entered ${input_box.value}`)
	raw_url = input_box.value
	streamable_url = null
	input_box.value = ""	
	state_change_handler()
}

// function id_gen() {
//      return Math.random().toString(36).replace(/[^a-z]+/g, '');
// }



// need to make listening events
// POTE - change to the flask url read dynamically
// const socket = io("http://localhost:5000")
// const socket = io() // be default it tries to connect to the same url from where it got this 

socket.on("connect", () => {
	console.log("Socket connection establised to the server")
})


socket.on("disconnect", () => {
	console.log("got disconnected")
	client_uid = null
	// console.log("was this because of a timeout") // no, it polls every 25s apparently

})

socket.on("state_update_from_server", (state) => {
	

	console.log("updating state")
	// video_playing = state.playing
	
	if (client_uid == null){
		client_uid = state.client_uid;
	}

	if (vid_src.src !== state.streamable_url){
		vid.pause()
		raw_url = state.raw_url
		streamable_url = state.streamable_url
		vid_src.src = streamable_url 
		vid.load()
	} 

	// POTE - assumes no time lost in buffering/loading etc
	let proposed_time = (state.playing) ? ((state.video_timestamp - state.global_timestamp) + get_global_time(correction) ) : (state.video_timestamp)

	let gap = Math.abs(proposed_time - vid.currentTime)

	console.log(`%cGap was ${proposed_time - vid.currentTime}`, 'font-size:18px; color:purple')
	if (state.playing){
		// if(gap > 0.2){ this was too much server pe
		if(gap > 1){
			// tolerance while the video is playing
			// console.log("playing gap was >1")
			vid.currentTime = proposed_time
		}
		vid.play()
	}
	else{
		vid.pause()
		// if (gap !== 0){
		// if (gap > 0.000001){
		if (gap > 0.01){
			// POTE - will it be exact 0?
			// condition to prevent an unnecessary seek
			// console.log("paused gap was >0.01")
			vid.currentTime = proposed_time
		}
	}
})

let state_change_handler = (event) => {
	// console.log(event)
	if (event !== null && event !== undefined){
		if (event.type === 'pause'){
			video_playing = false
		}
		else if (event.type === 'play'){
			video_playing = true
		}

	}
	// console.log('sending state update to server')
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
	// console.log(state_image)
	socket.emit("state_update_from_client", state_image)
}

vid.onseeking = state_change_handler
// vid.onseeked = state_change_handler
vid.onplay = state_change_handler
vid.onpause = state_change_handler
vid.onended = () => {
	video_playing = false
	last_updated = get_global_time(correction)
	vid.load()
	state_change_handler()
}

// let update_last_updated = () => {
// 	let curr = get_global_time()
// 	if (curr - last_updated > 0.3){
// 		last_updated = curr
// 	}
// }

let correction = 0
const max_over_estimate = 1000000
const min_under_estimate = -1000000
let over_estimate = max_over_estimate
const num_time_sync_cycles = 10
let under_estimate = min_under_estimate


function get_global_time(delta = 0){
	let d = new Date()
	let t = d.getTime()/1000
	return t + delta
}

console.log("%ctime correction disabled", "color:red; font-size:20px")


let do_time_sync_one_cycle_backward = () => {
	// console.log("look here")
	socket.emit("time_sync_request_backward")
}
let do_time_sync_one_cycle_forward = () => {
	// console.log("look here")
	socket.emit("time_sync_request_forward", get_global_time(0))
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let do_time_sync = async () => {
	for(let i = 0; i < num_time_sync_cycles; i++){
		// this doesnt work since setTimeout doesnt return a promise
		// await setTimeout(do_time_sync_one_cycle_backward, 10000)
		// await setTimeout(do_time_sync_one_cycle_forward, 10000)

		await timeout(1000)
		// console.log('one cycle done')
		do_time_sync_one_cycle_backward()
		await timeout(1000)
		// console.log(get_global_time())
		do_time_sync_one_cycle_forward()
	}
}
do_time_sync()

socket.on("time_sync_response_backward", (time_at_server)=>{
	under_estimate_latest =  time_at_server - get_global_time(0)
	const got_new_under_estimate = (under_estimate_latest > under_estimate)
	under_estimate = Math.max(under_estimate, under_estimate_latest)
	if ((under_estimate !== min_under_estimate) && (over_estimate !== max_over_estimate) && got_new_under_estimate){
		console.log(`%c Updated val for under_estimate is ${under_estimate}`, "color:green")
		correction = (under_estimate + over_estimate)/2		
		console.log(`%c New correction time is ${correction} seconds`, 'color:red; font-size:14px')
	}
})

socket.on("time_sync_response_forward", (calculated_diff)=>{
	over_estimate_latest = calculated_diff
	const got_new_over_estimate = (over_estimate_latest < over_estimate)
	over_estimate = Math.min(over_estimate, over_estimate_latest)
	if ((under_estimate !== min_under_estimate) && (over_estimate !== max_over_estimate) && got_new_over_estimate){
		console.log(`%c Updated val for over_estimate is ${over_estimate}`, "color:green")
		correction = (under_estimate + over_estimate)/2		
		console.log(`%c New correction time is ${correction} seconds`, 'color:red; font-size:14px')
	}
})


// the correction term includes the network lag
// can we do it multiple times and take the minimum
// correction_estimate = (true_clock_difference) + network_lag

// console.log("HELLLLO")

// shuru se likhenge


// let my_list = null
// socket.on('new_message', (msg) => {
// 	console.log("Received new message")
// 	if (my_list === null){
// 		my_list = document.createElement("ul")
// 		document.body.appendChild(my_list)
// 	}
// 	next_message = document.createElement("li")
// 	next_message.innerHTML = msg //when do we use value/text/innerHTML
// 	my_list.appendChild(next_message) 

// })


// socket.emit(event_name, object)
// example, 
// socket.emit('message', 'yolo')
// socket.emit('my event', {'data': 'this is a JS object'})

// poll every 10s to check if we were left behind due to buffering or something

// setTimeout(() => )

// setInterval( ()=>{
// 	socket.emit('explicit_request_for_state')
// }, 10000)