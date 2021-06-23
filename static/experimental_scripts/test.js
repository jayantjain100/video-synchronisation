
// JS file to experiment with snippets of code
// Usually written here and pasted in the console


// unanswered questions
// why doesn't the setTimeout function return callbacks?




// understanding how asynchronous calls work
// when do the callbacks actually execute

//add comments and then add this example

// function func_that_makes_async_call(msg){
// 	setTimeout(console.log, 100 ,msg);
// }
// func_that_makes_async_call("the function that makes an asy");


//loop takes 3 to 4 seconds
function long_loop(){
	let a = 0
	for(let i =0; i < 1000000000; i++){
		a += 1
	}
}

console.log("Started")
setTimeout(console.log, 100 ,"SetTimeout call 1")
setTimeout(console.log, 0   ,"SetTimeout call 2")

long_loop()
console.log("After loop 1")
setTimeout(console.log, 0   ,"SetTimeout call 3");

long_loop()
console.log("After loop 2")




// Create a nested promise example, make async function to return a promise

async function bar(){
	console.log("bar")
}
async function foo(){
	console.log("foo")
}
async function foobar(){
	console.log("entered foobar")
	foo()
	console.log("in between foobar")
	bar()
	console.log("exiting foobar")
}


console.log("Start")
foobar()
console.log("End")


async function foobar2(){
	console.log("entered foobar")
	await foo()
	console.log("in between foobar")
	await bar()
	console.log("exiting foobar")
}
console.log("Start")
foobar2()
console.log("End")


let a = myfoo()
console.log("yolo1")
console.log("yolo2")


// funda is ki async functions are asynchronous, they return promises instead of the value
// await keyword can be used in front of a promise (or equivalently a function call that will return a promise )
// await is the substitute for .then (is it though since we are returned another promise by async)


// playing with async and await

// writing the same thing with callbacks, promises and async await

// the task - generating a random number asynchronously, and then checking if it is less than a thresh or not


// 1. Callbacks
function gen_random(){
	return 0.3
}

// function using_callbacks(callback_success, callback_error){

// }
function gen_random(){
	return Math.random()
}
function using_promises(){
	return new Promise(
		(resolve, reject) => {
		let x = gen_random()
		if (x < 0.5){
			return resolve({message:"the num was less that 0.5, hooray"})
		}
		else{
			return reject({message:"the num was larger than 0.5, :("})
		}
	})
}

let p = using_promises()

console.log(p)
console.log("look here")

p.then(res => {
	console.log("in the 'then' ")
	console.log(res)
}).catch(err => {
	console.log("in the 'catch'")
	console.log(err)
})


// async function using_async_await(){
// 	let x = gen_random();

// }

// using promises

// POTE - UNEXPLAINED - weird error that if i open a new tab on chrome and paste this fetch code there toh it doesnt work

let a = fetch("http://127.0.0.1:5000/sync/")
.then(res =>{
	console.log(res)
	if (res.ok){
		return res.json()
	} 
}).then(
console.log
).catch(err => {
	console.log(`exception raised: ${err}`)
})

console.log(`a is ${a}`)
// using async await

async function fetch_my_thing(){
	let res = await fetch("http://127.0.0.1:5000/sync/")
	if (!res.ok){
		throw "Network error"
	}
	res = res.json()
	console.log("success")
	console.log(`res is ${res}`)
	return res
}

console.log("what prints first")
let a = fetch_my_thing().then(console.log).catch(err => {console.log(`error is ${err}`)})
console.log("what prints second")

async function myfoo(){
	console.log("hi1")
	console.log("hi2")
}

let a = myfoo()
console.log("yolo1")
console.log("yolo2")


// //loop takes 3 to 4 seconds
// function long_loop(){
// 	let a = 0;
// 	for(let i =0; i < 1000000000; i++){
// 		a += 1;
// 	}
// }

// function func_that_makes_async_call(msg){
// 	setTimeout(console.log, 100 ,msg);
// }

// console.log("Entered");
// setTimeout(console.log, 100 ,"async1");
// setTimeout(console.log, 0 ,"async2");
// func_that_makes_async_call("im the func that had an async call in it");
// long_loop()
// console.log("done1");
// long_loop()
// console.log("done2");
