const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';

socket.on('connect', connectHandler);
socket.on(`${room}Joined`, console.log);

function connectHandler() {
    console.log('Connected to socket.io server');
}

function handleMessage() {
    const message = document.getElementById('input').value;
    console.log(message);
    socket.emit('message', message);
}