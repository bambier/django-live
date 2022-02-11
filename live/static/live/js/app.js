let server = document.getElementById('server');
let client = document.getElementById('client');
let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');

let start = document.getElementById('start');
let end = document.getElementById('end');
let videoStream = null;

let socket = new WebSocket(
	'ws://'
	+ window.location.host
	+ '/live/'
);
socket.binaryType ="arraybuffer";


socket.onopen = (e) => {
	console.log("webSocket opend");
}
socket.onclose = (e) => {
	console.log("webSocket closed.");
}
socket.onerror = (e) =>{
	console.log("webSocket error", e );
}
socket.onmessage = function(e) {
	var message = e.data;
	console.log(message);
	var arr = new Uint8Array(message);
	var clx = client.getContext("2d");
	var imgData = clx.createImageData(client.width, client.height);
	for (let index = 0; index < arr.length; index++) {
		imgData.data[index] = arr[index];
	}
	clx.putImageData(imgData, 0, 0); 

}





const startLive = () => {
	navigator.mediaDevices.getUserMedia({ video: true})
	.then((stream) => {
		

		videoStream = stream;
		server.srcObject = stream;



	})
	.catch((err) => console.log(err));
}




server.addEventListener('play', function () {
	var $this = this; 
	(function loop() {
		if (!$this.paused && !$this.ended) {
			canvas.width = server.videoWidth;
			canvas.height = server.videoHeight;
			ctx.drawImage($this, 0, 0);
			setTimeout(loop, 1000 / 30);

			if (videoStream) {
				socket.send('sending')
				var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				var arr = new Uint8Array(imgData.data);
				socket.send(arr);

			}


		}
	})();
}, 0);









start.addEventListener('click', (event) => {
	startLive();
});

end.addEventListener('click', (event) => {
	if (videoStream){
		videoStream.getTracks().forEach(track => track.stop());
		videoStream = null;
	}
});