# Learnings

Here I have documented all the key things I learnt while developing this project. 

### 1. User vs Script caused Events

Sometimes it is useful to know whether an event was triggered by user action or caused by my script. Being able to distinguish between these 2 cases will make the state management easier.  

1. The isTrusted boolean [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted). Unfortunately this didnt work.


2. Till now, none of the techniques mentioned on stack overflow worked for me. 

	- MouseX and MouseY were not set for the play/pause event for an HTML5 video element
	- .originalEvent, .isTrusted did not show the desired behaviour

3. I thought of setting a global variable whenever the script would play/pause by doing something like - 

```js
caused_by_script = true
vid.play()
caused_by_script = false
```

The issue with this is that .play() returns a promise and without actually playing, the flag would be set to false again and not work. Note that .pause() does not return a promise since you can stop anytime, but to play you need to make sure that the next couple of frames are loaded and ready (This is what I think).

4. I could not find how to pass custom arguments to the event, which could supposedly be read in the event handlers for play/pause. Something like - 

```js
vid.play(custom_arg_script_caused_action = true)
```


### 2. Seeking a video

Seeking also causes an implicit pause-play when you try it on a playing video. 

### 3. Colors and Fonts in console log

An example - 
```javascript
console.log("%cBlue! %cGreen", "color: blue; font-size:15px;", "color: green; font-size:12px;");

```

### 4. Asynchronous Javascript

Developed a better understanding of using promises and async-await to write asynchronous code. 
Useful videos - 

- WebDevSimplified for how to use [Promises](https://www.youtube.com/watch?v=DHvZLI7Db8E&ab_channel=WebDevSimplified) and [Async-Await](https://www.youtube.com/watch?v=V_Kr9OSfDeU&ab_channel=WebDevSimplifiedWebDevSimplifiedVerified).

- Philip Robert's explanation in JSConf for [how the Event loop works](https://www.youtube.com/watch?v=8aGhZQkoFbQ&ab_channel=JSConfJSConf) 


### 5. Can't use global variables for state management at the server's end 

Servers need to run many processes/threads to handle simultaneous requests. If there were only 1 process running the flask application then only one user would get handled at a time and the rest would have to wait. With that said, directly having global variables for state management is not thread safe at all. If there are to be multiple processes, then each would have their own copy of the global variables and that would not work as expected. 

Currently I am using a development server with just 1 process and no threads and therefore am not facing these issues. 



### 6. Video element events 

Can understand how events fire in the video element better with this [tool](https://www.w3.org/2010/05/video/mediaevents.html).

[MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)



# Bugs I found Interesting 

### 1. Understanding the event you want to handle

TLDR: The [*seeked* event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeked_event) happens when the seek operation has completed, but the [*seeking* event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking_event) fires as soon as it the seeking operation starts. 

Observation \
1 in 10 times what happened was that a change made by someone got overridden by a response to a GET request that came in at the same time. This means that I was able to seek and change my time stamp (visibly), but not update the *last_updated* variable and that's why when a new GET request was called at that time, I did not ignore it and I updated the state based on that (since it looked like I received new information relative to our current state where *last_updated* was not updated). 

Hypothesis \
Maybe the *last_updated* variable was not getting set as soon as I seeked. 

Testing \
Added more prints to see when *last_updated* was being set.

Conclusion \
I was setting the *last_updated* after the seek event had been handled. Basically the difference between the seeked event and the seeking one. For a video which is not completely loaded already, there is a considerable gap between when the seeked and seeking event are fired. See this [illustration](https://www.w3.org/2010/05/video/mediaevents.html) and try seeking a part of the video which hasnt loaded yet. After realising this I had to set the *last_updated* time in the on_seeking event instead of the on_seeked one. 


