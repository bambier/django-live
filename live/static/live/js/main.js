const log = console.log
const selfVideo = document.getElementById('selfVideo');
const usernameInput = document.getElementById('username-input')
const usernameHeader = document.getElementById('username-header')
const start = document.getElementById('start')
const stop = document.getElementById('stop')
let username;
var webSocket;

let mapPeers = {}

usernameInput.addEventListener('input', e => {
	username = e.target.value;
	usernameHeader.innerText = 'Username : ' + username;
});







function webSocketOnMessage (event) {
	const parsedData = JSON.parse(event.data);
	const peerUsername = parsedData['peer'];
	
	if (username === peerUsername) {
		return;
	};
	
	
	const action = parsedData['action'];
	const receiver_channel_name = parsedData['message']['receiver_channel_name'];


	if (action === 'new-peer') {
		createOffer(peerUsername, receiver_channel_name);
		return;
	};

	if (action === 'new-offer') {
		const offer = parsedData['message']['sdp'];
		createAnswer(offer, peerUsername, receiver_channel_name);

		return;
	};

	if (action === 'new-answer') {
		const answer = parsedData['message']['sdp']

		const peer = mapPeers[peerUsername][0];

		peer.setRemoteDescription(answer);

		return;
	}

};






// Media Configs
let localStream = new MediaStream();


const constrains = {
	audio: {
		echoCancellation: true,
	}, 
	video:{
		width:360, height:240,
		echoCancellation: true,
	},
	echoCancellation: true,
}


start.addEventListener('click', e=> {
	e.preventDefault();
	usernameInput.disabled = true;

	// WebSocket configurations 
	let loc = window.location
	webSocket = new WebSocket(`wss://${loc.host}${loc.pathname}`);

	webSocket.onopen = (event) => {
		log('WebSocket opend.');
		sendSignal('new-peer', {});
	};

	webSocket.onclose = (event) => log('WebSocket Closed. STATUS:', event.code);

	webSocket.onerror =  (event) => log('WebSocket Error.', event);


	webSocket.onmessage = webSocketOnMessage;

	navigator.mediaDevices.getUserMedia(constrains)
		.then(stream => {
			localStream = stream;
			selfVideo.srcObject = stream;
		})
		.catch(error => {
			log(error);
		});
})

stop.addEventListener('click', e=> {
	localStream.getTracks().forEach(track => {
		track.stop();
	});
	usernameInput.disabled = false;
})






function sendSignal(action, message) {
	let jsonSTR = JSON.stringify({
		'peer': username,
		'action': action,
		'message': message
	});

	webSocket.send(jsonSTR);
};


function createAnswer(offer, peerUsername, receiver_channel_name) {
	// const iceConfig = {'iceServers': [{'urls': 'stun://127.0.0.2:4597'}]}
	// const peer = new RTCPeerConnection(iceConfig)
	const peer = new RTCPeerConnection(null);
	

	addLocalTracks(peer);

	const remoteVideo = createVideo(peerUsername);
	setOnTrack(peer, remoteVideo);


	peer.ondatachannel = (e) => {
		peer.dc = e.channel;
		peer.dc.onopen = (event) => {
			console.log('Connection opend!');
		};
		peer.dc.onmessage = dcOnMessage
		mapPeers[peerUsername] = [peer, peer.dc];
	
	};




	peer.oniceconnectionstatechange = (event) => {
		const iceConnectionState = peer.iceConnectionState

		if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
			delete mapPeers[peerUsername]
			if (iceConnectionState !== 'closed') {
				peer.close();
			};

			removeVideo(remoteVideo);
		};
	}


	peer.onicecandidate = (event) => {
		if (event.candidate) {
			log('New ice candidate', event.candidate.address);
			return;
		};

		sendSignal('new-answer', {
			'sdp': peer.localDescription,
			'receiver_channel_name': receiver_channel_name,

		});
	};

	peer.setRemoteDescription(offer)
		.then(e => {
			log('Remote description set successfuly for', peerUsername);
			return peer.createAnswer();


		})
		.then(a => {
			log('Answer created!');
			peer.setLocalDescription(a);
		})
		


};



function createOffer(peerUsername, receiver_channel_name) {
	// const iceConfig = {'iceServers': [{'urls': 'stun://127.0.0.2:4597'}]}
	// const peer = new RTCPeerConnection(iceConfig)
	const peer = new RTCPeerConnection(null);
	

	addLocalTracks(peer);

	const dc = peer.createDataChannel('channel');
	dc.onopen = (event) => {
		console.log('Connection opend!');
	};

	dc.onmessage = dcOnMessage



	const remoteVideo = createVideo(peerUsername);
	setOnTrack(peer, remoteVideo);

	mapPeers[peerUsername] = [peer, dc];

	peer.oniceconnectionstatechange = (event) => {
		const iceConnectionState = peer.iceConnectionState

		if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
			delete mapPeers[peerUsername]
			if (iceConnectionState !== 'closed') {
				peer.close();
			};

			removeVideo(remoteVideo);
		};
	}


	peer.onicecandidate = (event) => {
		if (event.candidate) {
			log('New ice candidate', event.candidate.address);
			return;
		};

		sendSignal('new-offer', {
			'sdp': peer.localDescription,
			'receiver_channel_name': receiver_channel_name,

		});
	};

	peer.createOffer()
		.then(o => peer.setLocalDescription(o))
		.then(() => log('Local Description set successfully.'));


};


function addLocalTracks(peer) {
	localStream.getTracks().forEach(track => {
		peer.addTrack(track, localStream);
	});
	return;
};


let messageList = document.querySelector('#message-list');
function dcOnMessage(evnet) {
	const message = event.data;
	const li = document.createElement('li');
	li.appendChild(document.createTextNode(message));
	messageList.appendChild(li);
}



function createVideo(peerUsername) {
	const videoContainer = document.getElementById("video-container");

	const remoteVideo = document.createElement('video');
	remoteVideo.id = peerUsername + '-video'
	remoteVideo.autoplay = true;
	remoteVideo.playsInline = true;
	remoteVideo.title = peerUsername;

	videoContainer.appendChild(remoteVideo);

	return remoteVideo;

};



function setOnTrack(peer, remoteVideo) {
	const remoteStream = new MediaStream();

	
	remoteVideo.srcObject = remoteStream;

	peer.addEventListener('track', async (event) => {
		remoteStream.addTrack(event.track, remoteStream);

	});


};






function removeVideo(remoteVideo) {
	const videoWraper = remoteVideo.parentNode;


	videoWraper.removeChild(remoteVideo);


}



