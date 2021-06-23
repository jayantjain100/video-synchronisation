from flask import Flask, render_template
from flask_socketio import SocketIO, emit, send
import time 
import pafy
from termcolor import cprint
from args import make_args

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret_key?'
socketio = SocketIO(app)
# socketio = SocketIO(app, cors_allowed_origins='*')

# THRESH_IGNORANCE = 12 # means ignoring others for 12s, debugging purposes
THRESH_IGNORANCE = 1
# THRESH_IGNORANCE = 0.5
# THRESH_IGNORANCE = 0 #means never ignoring anyone - causes the infinite loop issue


@app.route("/")
def homepage():
	return render_template('index.html')

# note that connect, disconnect, json and message are keywords

@socketio.on('explicit_request_for_state')
def explicit_state_request():
	emit('state_update_from_server', state)


@socketio.on('connect')
def connection_event():
	global num_users, unique_id, state
	num_users += 1
	print(f"new user connected, now num users is {num_users}")
	copy_of_state = state.copy()
	copy_of_state['client_uid'] = unique_id
	unique_id += 1
	emit('state_update_from_server', copy_of_state)


@socketio.on('disconnect')
def connection_event():
	global num_users
	num_users -= 1
	print(f"User disconnected, now num users is {num_users}")


@socketio.on("time_sync_request_backward")
def time_sync_response_backward():
	emit("time_sync_response_backward", time.time())


@socketio.on("time_sync_request_forward")
def time_sync_response_forward(time_at_client):
	emit("time_sync_response_forward", time.time() - time_at_client)


@socketio.on("state_update_from_client")
def state_change_for_all(potential_new):
	global state
	global THRESH_IGNORANCE
	print(f"at {time.ctime()}, req from:{potential_new['client_uid']}, goto {potential_new['video_timestamp']}, playing: {potential_new['playing']}, last_updated was {round((potential_new['last_updated'])%100, 4)}")
	too_soon = (time.time() - state["last_updated"]) < THRESH_IGNORANCE
	other_ip = (potential_new["client_uid"] != state["client_uid"])
	url_diff = potential_new["raw_url"] != state["raw_url"]
	stale = (potential_new["last_updated"] < state["last_updated"])

	if (too_soon and other_ip) or stale:
		cprint("rejected", "red")
		return 

	cprint("accepted", "green")
	if url_diff:
		state = fresh_state(potential_new["raw_url"])
		emit("state_update_from_server", state, broadcast = True, include_self = True)
		return
	
	state = potential_new
	if state["streamable_url"] is None:
		cprint("shouldnt have happened", "red")
		state["streamable_url"] = get_streamable_url(state["raw_url"])
	
	emit("state_update_from_server", state, broadcast = True, include_self = False)
	

def get_streamable_url(youtube_url):
	temp = pafy.new(youtube_url)
	#LATER - check which stream this is - dont need super high quality
	# return temp.allstreams[-1].url_https
	return temp.getbest().url_https

def fresh_state(youtube_url):
	return {
		"video_timestamp" : 0,
		"playing": False,
		"raw_url" : youtube_url,
		"streamable_url" : get_streamable_url(youtube_url),
		"last_updated" : time.time(),
		"global_time": 0,
		"client_uid" : None
	}

if __name__ == "__main__":
	num_users = 0
	unique_id = 0
	state = fresh_state(youtube_url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ" )
	state["streamable_url"] = get_streamable_url(state["raw_url"])
	
	args = make_args()
	print(args)
	
	host = "127.0.0.1" if not args.public else "0.0.0.0"
	socketio.run(app, debug = args.debug, host = host)
	