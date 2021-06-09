from flask import Flask, render_template, request
from flask_restful import Api, Resource, reqparse
import time
from termcolor import cprint

from args import *


app = Flask(__name__)
api = Api(app)
# all_posts = []

put_request_args = reqparse.RequestParser()
put_request_args.add_argument("timestamp", type = float, help = "Current timestamp of the video", required = True)
put_request_args.add_argument("paused", type = bool, help = "Whether the video is paused or not", required = True)
put_request_args.add_argument("global_time_state_was_updated_at", type = float, help = "The last global timestamp when the state was updated", required = True)
put_request_args.add_argument("global_time_to_sync_relative_video_tms", type = float, help = "The global time recorded alongside the videos current time (relative)", required = True)


@app.route('/')
def index():
	return render_template("index.html")

'''
We need extra flags to handle 2 things - 
1. out of order requests 
2. latency - requests and responses sent are received after some lag because of the network

'''
state = {
	"timestamp" : 0,
	"paused" : True,
	"global_time_state_was_updated_at" : time.time(), #time passing by is not an "update"
	"global_time_to_sync_relative_video_tms": time.time(),
}

# inheriting functionality and properties from the Resource parent class
class Synchronisation(Resource):
	def get(self):
		global state	

		# now we are doing these calculations at the client's end
		# if not state["paused"]:
			# current_time = time.time()
			# state["timestamp"] += (current_time - state["global_time_to_sync_relative_video_tms"])
			# state["global_time_to_sync_relative_video_tms"] = current_time

		return state

	def post(self):
		global state, all_posts
		client_request = put_request_args.parse_args()
		# print(f"received a post request from {request.remote_addr} to update state to {client_request}")
		
		# debugging		
		# all_posts.append(client_request.copy())
		# cprint(f"Look here - {len(all_posts)}", "cyan")
		# print(*all_posts, sep = "\n")
		# print()

		if client_request.global_time_state_was_updated_at < state["global_time_state_was_updated_at"]:
			# cant update the state, since we already have the state corresponding to something that a client did later
			print("Stale POST request")
			pass
		else:
			state["global_time_to_sync_relative_video_tms"] = client_request.global_time_to_sync_relative_video_tms
			state["global_time_state_was_updated_at"] = client_request.global_time_state_was_updated_at
			state["timestamp"] = client_request.timestamp
			state["paused"] = client_request.paused
			print(f"Updated state to {state}")

		# we dont need to return anything as of now, since the person will eventually GET it, pun intended
		return {}

class GlobalTimeSynchronisation(Resource):
	def get(self):
		return {"time":time.time()}

api.add_resource(Synchronisation, "/sync/")
api.add_resource(GlobalTimeSynchronisation, "/sync/time/")

if __name__ == "__main__":
	args = make_args()
	print(args)
	host = "127.0.0.1" if not args.public else "0.0.0.0"
	app.run(debug = True, host = host, threaded = False, processes = 1)
	# app.run(debug = True, host="127.0.0.1", threaded = False, processes = 1)
	# app.run(debug = True, host="127.0.0.1", threaded = True, processes = 1)
	# app.run(debug = True, host="127.0.0.1", threaded = False, processes = 2)
	# app.run(host="0.0.0.0")

