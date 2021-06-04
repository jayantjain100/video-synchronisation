import requests

url = 'http://127.0.0.1:5000/sync/'

# a = requests.get(url)
# print(a.json())


put_request_object = {"timestamp": 0.3, "paused": False}
b = requests.post(url, put_request_object)
print(b.json())