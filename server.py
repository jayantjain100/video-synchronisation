
# from flask import Flask, request
from flask import Flask, render_template, request
from flask_restful import Api, Resource, reqparse
import time

app = Flask(__name__)
api = Api(app)

put_request_args = reqparse.RequestParser()
put_request_args.add_argument("timestamp", type = float, help = "Current timestamp of the video", required = True)
put_request_args.add_argument("paused", type = bool, help = "Whether the video is paused or not", required = True)


@app.route('/')
def index():
	return render_template("index.html")

state = {
	"timestamp" : 0,
	"paused" : True
}

last_noted = 0

# inheriting functionality and properties from the Resource parent class
class Synchronisation(Resource):
	def get(self):
		global state, last_noted
		current_time = time.time()
		if not state["paused"]:
			state["timestamp"] += (current_time - last_noted)
		last_noted = current_time
		return state

	def post(self):
		global state, last_noted
		args = put_request_args.parse_args()
		print(f"received a post request from {request.remote_addr} to update state to {args}")
		state = args
		print(f"now the state is {state}")
		last_noted = time.time()
		return state

api.add_resource(Synchronisation, "/sync/")

if __name__ == "__main__":
	app.run(debug = True, host="0.0.0.0")
	# app.run(host="0.0.0.0")

