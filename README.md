# Video-Synchronisation

This is a web application that lets you stream videos with your friends with synchronisation. 

## Dependencies

Before installing the dependencies, it is recommended to create a virual environment to prevent confilcts with the existing environment. Using conda, 

```bash
# conda create -n video_sync python=3.7.8
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
python server_socketio.py 
```

To make it publicly accessible (unsafe) - 
```bash
python server.py -public
python server_socketio.py -public
```

Access the application by opening ip:port in your browser. 

