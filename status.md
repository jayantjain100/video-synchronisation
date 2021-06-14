## Known flaws in the program

#### 1. Simultaneous changes don't get registered

Below is a sequence of events which could cause undesired behavior (assume 2 clients)- 

- User1 makes a change, Client1 makes a POST request, the server registers stores this state, let's call it state1
- Client2 makes a GET request (periodic), and the server sends back the state1 that Client1 had shared
- User1 makes another change, Client1 makes a POST request, the server registers this new state, call it state2
- Meanwhile Client2 was busy implementing the state1 changes and on completion makes a POST request to the server, with state3 which has almost identical fields except the *last_updated* field (global_time_state_was_updated_at).
- At the server's end state2 gets overwritten by state3, even though state2 is the one with the latest change made by a user. 

Basically an older state has a later timestamp just because after everyone gets the latest change, they perform it and push the last_updated time further which is inaccurate. This could be avoided if we could distinguish between user caused and script caused events.   

Currently, making back to back changes could cause unexpected behaviour. If enough time is given after a change for the message to go to the server, then from the server to everyone, then for everyone to implement it and send back their acknowledgments (their versions of the updated state), then it should work fine. 



#### 2. Global time mismatch

We need a common global time for all machines to account for network latency and identify out of order requests (the server ignores POST requests with older timestamps, and the client ignores responses to it's periodic GET request which have older timestamps). But, the time depends on the local system time which can be off by a couple of seconds (as was in my 2 machines). So initially we can synchronise our times with the server, or everyone can sync with some atomic time api, but there would be a lag in the response and that can't be corrected. So unless everyone has synchronised local times from the start, there is no way to fix this. 

#### 3. Buffering aspect not handled

If a user has a slow connection and the video starts buffering then the video doesnt trigger the paused event and other users keep on going ahead. Have to find a solution for this later. Potential fix is to pause when someone buffers and then everyone will get this, but have to decide is this is the intended behaviour. 


## Pending Testing

1. What would happen if one user loses their connection in between and is unable to load the video further? Does it go into a paused state for everyone or does it remain in the playing state without actually running. Case1 is undesired since if someone has internet trouble I would not want the video to stop for everyone (or do I?). Case2 is undesired since I calculate the new timestamp with the assumption that the video was playing without interrupts. 


## Next Steps  

1. Exploring how to initiate requests from the server's end possibly using a different protocol. Should improve the current polling approach since currently the worst case is that the update is received after the polling_time_period which I can't set arbitrarily low since I dont want to overload the server as well as the client with computation that is mostly redundant. 

2. Adding support for youtube videos and for users to upload their own videos. 

3. Creating user sessions and possibly letting users make accounts and log in. 

4. Creating rooms, so that simultaneously two or more groups of people can watch different things. 

5. Making the code thread safe by removing global variables in the server code. 

6. Deployment to AWS. 

7. Improving the synchronisation quality- getting frame level synchronisation. 

8. The option to pre-download the video and use the internet for just synchronisation. (e.g if someone has a slow connection)

9. Think of the compression aspect? if you upload your own video vs directly using netflix and youtube, you lose out on the benefits like compression and CDNs (which reduce latency by having nearby servers).



## Some fixes to the problems

1. Currently I block the server for 1 second from accepting requests from different clients once it receives a new state update. This helps prevent processing the redundant requests the users send after they implement a change (since we dont distinguish bw user caused and event caused). Compromise - if I make a change, and my friend makes a change 0.5s later at his/her end, their legitimate change would get ignored.