from argparse import ArgumentParser


def make_args():
	parser = ArgumentParser()
	parser.add_argument("-public", action="store_true", dest = "public")
	parser.add_argument("-debug", action = "store_true", dest = "debug")
	parser.add_argument("-not_debug", action = "store_false", dest = "debug")
	parser.set_defaults(public = False )
	parser.set_defaults(debug = True )
	args = parser.parse_args()
	return args