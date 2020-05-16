


document.addEventListener('DOMContentLoaded', () => {
	

	// CONFIGURE SEND BUTTON TO DISABLE WHEN NO INPUT
	document.querySelector("#send").disabled = true;

	document.querySelector("body").onmouseover = () =>{
		if (document.querySelector("#message-input").value.length > 0)
			document.querySelector("#send").disabled = false;
		else
			document.querySelector("#send").disabled = true;
	};
	document.querySelector("#message-input").onkeyup = () => {
		if (document.querySelector("#message-input").value.length > 0)
			document.querySelector("#send").disabled = false;
		else
			document.querySelector("#send").disabled = true;
	};
	

	
	sessionStorage.setItem('sessionUser', document.querySelector("#username").innerHTML);

	// CONNECT TO WEBSOCKET
	var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


	// CONFIGURE SOCKET
	socket.on('connect', () => {

		// CONFIGURE SEND BUTTON
		document.querySelector('#send').onclick = () => {
			const text = document.querySelector('#message-input').value;
			const channel = sessionStorage.getItem("currChannel");
			const user = sessionStorage.getItem("sessionUser");
			var time = new Date();
			time = time.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
			time.Hour;
			time.Minute;
			document.querySelector('#message-input').value = '';
            
			socket.emit('send message', {'text':text, 'channel':channel, 'time':time, 'user':user});

		};

		// CONFIGURE ADD CHANNEL BUTTON
		document.querySelector("#add_channel").onclick = () => {
			var channel_name = document.querySelector("#channel-name").value;
			document.querySelector("#channel-name").value = '';
			socket.emit('add channel', {'channel_name':channel_name});

		};

		// CONFIGURE CLICK ON CHANNEL FOR ACTIVE USERS
		document.querySelector('#channel_list').onmouseover = () => {
			channels = document.querySelector("#channel_list").childNodes;
			for (var i = 0; i < channels.length; i++) {
				let cur = channels[i];
				cur.onclick = () => {
					var channel_name = cur.innerHTML;
					var currChannel = sessionStorage.getItem("currChannel");
					document.querySelector("[id=" + CSS.escape(currChannel)+ "]").style.display = 'none';
					for (var j = 0; j < channels.length; j++) {
						channels[j].style.background = '#D2DCD2';
					}

					localStorage.setItem("currChannel", channel_name);

					var chan = JSON.parse(localStorage.getItem("Channels"));
					var prevChannel;
					var chanIndex = 0;

					// REMOVE USER FROM PREVIOUS CHANNEL'S ACTIVE USERS
					for (var j = 0; j < chan.length; j++) {
						if (chan[j].name == localStorage.getItem("currChannel")) {
							chanIndex = j;
						}
						for (var k = 0; k < chan[j].users.length; k++) {
							if (chan[j].users[k] == sessionStorage.getItem("sessionUser")) {
								chan[j].users.splice(k,1);
								prevChannel = chan[j].name;

							}
						}
					}


					sessionStorage.setItem("currChannel", channel_name);
					currChannel = sessionStorage.getItem("currChannel");
					document.querySelector("[id=" + CSS.escape(currChannel)+ "]").style.display = 'block';
					cur.style.background = 'gray';
					var messages = document.querySelector(".msgBox");
					messages.scrollTop = messages.scrollHeight;

					

					// ADD ACTIVE USER TO NEW CHANNEL
					var newChannel = chan[chanIndex].name;
					chan[chanIndex].users.push(sessionStorage.getItem('sessionUser'));
					localStorage.setItem("Channels", JSON.stringify(chan));
					socket.emit("channel click", {'prevChannel': prevChannel, 'newChannel': newChannel});
				};
			};
		};

	});


	// UPDATE ACTIVE USERS
	socket.on('update users', data => {
		if ((sessionStorage.getItem('currChannel') == data.prev) || (sessionStorage.getItem('currChannel') == data.new)) {
			document.querySelector("#activeUsers").innerHTML = '';
			var channels = JSON.parse(localStorage.getItem("Channels"));
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].name == sessionStorage.getItem('currChannel')) {
					for (var j = 0; j < channels[i].users.length; j++) {
						const li = document.createElement('li');
						li.innerHTML = channels[i].users[j];
						document.querySelector("#activeUsers").append(li);
					}
				}
				
			}

		}

	});


	// RECEIVE MESSAGE
	socket.on('receive message', data => {
		var channels = JSON.parse(localStorage.getItem('Channels'));
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == data.channel) {
				var messageObj = {user: data.user, text: data.text, time: data.time};
				channels[i].messages.push(messageObj);
				if (channels[i].messages.length >= 100) {
					channels[i].messages.shift();
					message = document.querySelector("[id=" + CSS.escape(channels[i].name)+ "]");
					message.removeChild(message.childNodes[0]);
				}
				
			}
			
		}
		localStorage.setItem("Channels", JSON.stringify(channels));

		// CREATE MESSAGE ELEMENT
		const div = document.createElement('div');
		var sessionUser = sessionStorage.getItem('sessionUser');
		// console.log(sessionUser);
		if (data.user == sessionUser)
			div.className = 'myMessage col-8';
		else
			div.className = 'yourMessage col-8';
		document.querySelector("[id=" + CSS.escape(data.channel)+ "]").append(div);

		const toprow = document.createElement('div');
		toprow.className = 'row';
		div.append(toprow);

		const username = document.createElement('div');
		username.className = 'username col-4';
		username.innerHTML = data.user;
		toprow.append(username);

		const msg = document.createElement('div');
		msg.className = 'col';
		msg.innerHTML = data.text;
		toprow.append(msg);

		const bottomrow = document.createElement('div');
		bottomrow.className = 'row';
		div.append(bottomrow);

		const timestamp = document.createElement('div');
		timestamp.className = "timestamp col-12";
		timestamp.innerHTML = data.time;
		bottomrow.append(timestamp);

		var messages = document.querySelector("[id=" + CSS.escape(data.channel)+ "]");
		messages.scrollTop = messages.scrollHeight;


	});


	// RECIEVE ADD CHANNEL
	socket.on('complete channel add', data => {
		const channel_name = data.channel_name;

		// CHECK IF THERE ARE ANY CHANNELS
		if (!localStorage.getItem("Channels")){

			// CREATE CHANNEL OBJECT
			var users = [];
			var messages = [];
			var channelObj = {name: channel_name, messages: messages, users: users};
			var channels = [channelObj];
			localStorage.setItem("Channels", JSON.stringify(channels));


			// CREATE AND ADD CHANNEL TO LIST
			const li = document.createElement('li');
			li.innerHTML = channel_name;
			li.className = 'channelItem';
			document.querySelector("#channel_list").append(li);

			// ADD MSGBOX
			const msgbox = document.createElement('div');
			msgbox.className = 'container msgBox';
			msgbox.id = channel_name;
			document.querySelector("#message-screen").append(msgbox);
			msgbox.style.display = 'none';
			


			// CLEAR FORM
			document.querySelector("#channelError").style.display = 'none';
			document.querySelector('#addNewChannel').style.display = 'none';
		}
		else{

			// GET ARRAY OF CHANNELS 
			var channels = JSON.parse(localStorage.getItem("Channels"));

			// CHECK IF CHANNEL NAME IS VALID
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].name == channel_name) {
					document.querySelector("#channelError").style.display = 'block';
					return;
				}
			}
			var users = [];
			var messages = [];
			const channelObj = {name:channel_name, messages:messages, users:users};
			channels.push(channelObj);
			localStorage.setItem("Channels", JSON.stringify(channels));

			// CREATE AND ADD CHANNEL TO LIST
			const li = document.createElement('li');
			li.innerHTML = channel_name;
			li.className = 'channelItem';
			document.querySelector("#channel_list").append(li);

			// ADD MSGBOX
			const msgbox = document.createElement('div');
			msgbox.className = 'container msgBox';
			msgbox.id = channel_name;
			document.querySelector("#message-screen").append(msgbox);
			msgbox.style.display = 'none';


			// CLEAR FORM
			document.querySelector("#channelError").style.display = 'none';
			document.querySelector('#addNewChannel').style.display = 'none';

		}

	});



	// SEE IF CHANNELS EXIST
	if (localStorage.getItem('Channels')){

		// ADD EXISTING CHANNELS
		var channels = JSON.parse(localStorage.getItem('Channels'));
		for (i=0; i < channels.length; i++){

			// ADD CHANNELS TO CHANNEL LIST

			let channel_name = channels[i].name			
			const li = document.createElement('li');
			li.innerHTML = channel_name;
			li.className = 'channelItem';
			document.querySelector("#channel_list").append(li);

			// ADD MSGBOXES FOR EACH CHANNEL
			const msgbox = document.createElement('div');
			msgbox.className = 'container msgBox';
			msgbox.id = channel_name;


			// ADD MESSAGES TO MSGBOXES
			document.querySelector("#message-screen").append(msgbox);
			document.querySelector("[id=" + CSS.escape(channel_name)+ "]").style.display = 'none';

			for (var j = 0; j < channels[i].messages.length; j++) {
				const user = channels[i].messages[j].user;
				const text = channels[i].messages[j].text;
				const time = channels[i].messages[j].time;

				// CREATE MESSAGE ELEMENT
				const div = document.createElement('div');
				var sessionUser = sessionStorage.getItem('sessionUser');

				if (user == sessionUser)
					div.className = 'myMessage col-8';
							
				else
					div.className = 'yourMessage col-8';

				let name = channels[i].name;
				document.querySelector("[id=" + CSS.escape(name)+ "]").append(div);

				const toprow = document.createElement('div');
				toprow.className = 'row';
				div.append(toprow);

				const username = document.createElement('div');
				username.className = 'username col-4';
				username.innerHTML = user;
				toprow.append(username);

				const msg = document.createElement('div');
				msg.className = 'col';
				msg.innerHTML = text;
				toprow.append(msg);

				const bottomrow = document.createElement('div');
				bottomrow.className = 'row';
				div.append(bottomrow);

				const timestamp = document.createElement('div');
				timestamp.className = "timestamp col-12";
				timestamp.innerHTML = time;
				bottomrow.append(timestamp);

				var box = document.querySelector("[id=" + CSS.escape(name)+ "]")
				box.scrollTop = box.scrollHeight;


			}
			
		}

		// SET A CURRENT CHANNEL

		var channel_name = localStorage.getItem("currChannel");
		sessionStorage.setItem("currChannel", channel_name);
		var channels = document.querySelector("#channel_list").childNodes;
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].innerHTML == channel_name) {
					var cur = channels[i];
					cur.style.background = 'gray';	
				}		
		}
		document.querySelector("[id=" + CSS.escape(channel_name)+ "]").style.display = 'block';

		// UPDATE ACTIVE USER LIST
		document.querySelector("#activeUsers").innerHTML = '';
		var channels = JSON.parse(localStorage.getItem("Channels"));
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == sessionStorage.getItem('currChannel')) {
				for (var j = 0; j < channels[i].users.length; j++) {
					const li = document.createElement('li');
					li.innerHTML = channels[i].users[j];
					document.querySelector("#activeUsers").append(li);
				}
			}
			
		}
	}

	else{
		const msgbox = document.createElement('div');
		msgbox.className = 'container msgBox';
		msgbox.id = 'noChannels';
		document.querySelector("#message-screen").append(msgbox);
		localStorage.setItem("currChannel", msgbox.id);
		sessionStorage.setItem("currChannel", msgbox.id);
		document.querySelector("[id=" + CSS.escape(msgbox.id)+ "]").style.display = 'block';

	}
		


	// SHOW CHANNEL ADDER FORM
	document.querySelector('#add').onclick = () => {
		document.querySelector('#addNewChannel').style.display = 'block';
	};

	// HIDE CHANNEL ADDER FORM
	document.querySelector("#upArrow").onclick =() =>{
		document.querySelector('#addNewChannel').style.display = 'none';
	}




	// CLICK ON A CHANNEL
	document.querySelector('#channel_list').onmouseover = () => {
		channels = document.querySelector("#channel_list").childNodes;
		for (var i = 0; i < channels.length; i++) {
			let cur = channels[i];
			cur.onclick = () => {
				var channel_name = cur.innerHTML;
				var currChannel = sessionStorage.getItem("currChannel");
				document.querySelector("[id=" + CSS.escape(currChannel)+ "]").style.display = 'none';
				for (var i = 0; i < channels.length; i++) {
					channels[i].style.background = '#D2DCD2';
				}
				localStorage.setItem("currChannel", channel_name);
				sessionStorage.setItem("currChannel", channel_name);
				currChannel = sessionStorage.getItem("currChannel");
				document.querySelector("[id=" + CSS.escape(currChannel)+ "]").style.display = 'block';
				cur.style.background = 'gray';
				var messages = document.querySelector(".msgBox");
				messages.scrollTop = messages.scrollHeight;


			}
		}
	};


	// MAKE SURE MESSAGES ARE ALWAYS AT BOTTOM OF SCROLL
	var currChannel = sessionStorage.getItem("currChannel");
	var messages = document.querySelector("[id=" + CSS.escape(currChannel)+ "]");
	messages.scrollTop = messages.scrollHeight;

});


