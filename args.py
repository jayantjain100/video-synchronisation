from argparse import ArgumentParser


def make_args():
	parser = ArgumentParser()
	parser.add_argument("-public", action="store_true", dest = "public", help = "makes the application accessible to everyone on your network")
	parser.add_argument("-debug", action = "store_true", dest = "debug", help = "runs the server in debugging mode")
	parser.set_defaults(public = False )
	parser.set_defaults(debug = False )
	args = parser.parse_args()
	return args