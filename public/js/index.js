const socket = io.connect('http://localhost:3000');

socket.on('test', console.log);
socket.on('connect', connectHandler);

function connectHandler() {
    console.log('Connected to socket.io server');
}

function handleMessage() {
    const message = document.getElementById('input').value;
    console.log(message);
    socket.emit('message', message);
}