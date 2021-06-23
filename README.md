# Video-Synchronisation

This is a web application that lets you stream youtube videos with your friends in synchronisation. 
<!-- ![demo_interface_from_ezgif_smaller_version_take3_optimised](https://user-images.githubusercontent.com/31953115/123140923-78ed1e80-d475-11eb-9003-35baa549a552.gif) -->
<br>
<p align = "center">
  <img src="https://user-images.githubusercontent.com/31953115/123140923-78ed1e80-d475-11eb-9003-35baa549a552.gif" alt="animated" />
</p>

## Dependencies

Before installing the dependencies, it is recommended to create a virual environment to prevent confilcts with the existing environment. Using conda, 

```bash
conda create -n video_sync python=3.7.5
conda activate video_sync
``` 

To install the dependencies - 
```bash
pip install -r requirements.txt
```

## Usage

Get the server started by running - 

```bash
python server.py 
```

To make it accessible on the network (unsafe) - 
```bash
python server.py -public
```

Access the application by opening ip:port in your browser. For example if you are running the server on the same machine, and the port is 5000 (default), just enter http://127.0.0.1:5000 in the browser. 

