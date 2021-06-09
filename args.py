from argparse import ArgumentParser


def make_args():
	parser = ArgumentParser()
	parser.add_argument("-public", action="store_true", dest = "public")
	
	parser.set_defaults(public = False )
	args = parser.parse_args()
	return args