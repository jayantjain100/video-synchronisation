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
THRESH_IGNORANCE = 0.5


@app.route("/")
def homepage():
	return render_template('index_socketio.html')

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

# @socketio.on('message')
# def received_message_event(message):
# 	print(f"received {message}")

# @socketio.on("enter_msg")
# def my_event(user_input):
# 	print(f"user entered: {user_input} \nand the type was {type(user_input)}")
# 	emit("new_message", user_input, broadcast = True)

@socketio.on("state_update_from_client")
def state_change_for_all(potential_new):
	global state
	# print(state, potential_new)
	global THRESH_IGNORANCE
	# global last_state_update_from_client_time, last_state_update_from_client_uid

	print(f"at {time.ctime()}, req from:{potential_new['client_uid']}, goto {potential_new['video_timestamp']}, playing: {potential_new['playing']}, last_updated was {round((potential_new['last_updated'])%100, 4)}")

	# too_soon = (time.time() - last_state_update_from_client_time) < THRESH_IGNORANCE
	too_soon = (time.time() - state["last_updated"]) < THRESH_IGNORANCE
	other_ip = (potential_new["client_uid"] != state["client_uid"])
	url_diff = potential_new["raw_url"] != state["raw_url"]

	if too_soon and other_ip:
		cprint("rejected", "red")
		return 

	if potential_new["last_updated"] > state["last_updated"]:
		cprint("accepted", "green")
		state = potential_new
		if state["streamable_url"] is None:
			state["streamable_url"] = get_streamable_url(state["raw_url"])
		
		# last_state_update_from_client_uid = state["client_uid"]
		# last_state_update_from_client_time = time.time()

		# emit("state_update_from_server", state, broadcast = True)
		if url_diff:
			emit("state_update_from_server", state, broadcast = True, include_self = True)
		else:
			emit("state_update_from_server", state, broadcast = True, include_self = False)

	else:
		print("stale request received for state change")


# this does not solve our problem
# the problem is that for a seek while running we send out 3 consecutive requests
# and all 3 are different, first is old tms with pause, next is new tms with pause, third is new tms with play
# side by side the other people receive these and do their own thing and send back an update
# if we can detect the old states coming from users, by say maintaining a sequence of states and seeing if their request is extremely similar to something in the past then we can ignore 

# this issue is related to the previous one - that we cant do consecutive changes

# def enough_change_to_send_out(old_state, new_state):
# 	# checks if the new state is a significant change or not
# 	if new_state["last_updated"] < old_state["last_updated"]:
# 		return False 
# 	if new_state['raw_url'] != old_state['raw_url']:
# 		return True
# 	if new_state['streamable_url'] != old_state['streamable_url']:
# 		return True
# 	diff_new = new_state['global_time'] - new_state['video_timestamp']
# 	diff_old = old_state['global_time'] - old_state['video_timestamp']
# 	if abs(diff_old - diff_new) < 0.05:
# 		return False
# 	return True



def get_streamable_url(youtube_url):
	# print(youtube_url)
	temp = pafy.new(youtube_url)
	#POTE - check which stream this is 
	return temp.allstreams[-1].url_https



@socketio.on("time_sync")
def time_sync_response():
	emit("time_sync_response", time.time())


if __name__ == "__main__":
	# state
	num_users = 0
	unique_id = 0
	# last_state_update_from_client_uid = 0
	# last_state_update_from_client_time = 0
	state = {
		"video_timestamp" : 0,
		"playing": False,
		"raw_url" : "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"streamable_url" : None,
		"last_updated" : time.time(),
		"global_time": 0,
		"client_uid" : None
	}
	state["streamable_url"] = get_streamable_url(state["raw_url"])
	# app.run(debug = True)

	# socketio.run(app, debug = True)
	args = make_args()
	print(args)
	host = "127.0.0.1" if not args.public else "0.0.0.0"
	socketio.run(app, debug = args.debug, host = host)
	# socketio.run(app)
