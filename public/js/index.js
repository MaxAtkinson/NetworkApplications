const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';

socket.on('connect', connectHandler);
socket.on(`${room}Joined`, console.log);

function connectHandler() {
    console.log('Connected to socket.io server.');
}

function handleSendMessage() {
    const message = document.getElementById('input').value;
    if (message.trim() !== '') {
        console.log(message);
        socket.emit('message', message);
    }
}