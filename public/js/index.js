const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';

socket.on('connect', connectHandler);
socket.on('message', handleReceiveMessage);
socket.on(`${room}Joined`, console.log);

function connectHandler() {
    console.log('Connected to socket.io server.');
}

function handleSendMessage() {
    const message = $('#input').val();
    if (message.trim() !== '') {
        console.log(message);
        socket.emit('message', message);
    }
}

function handleReceiveMessage(msg) {
    const $para = $('<p></p>').text(msg);
    $('#chat').append($para);
}
