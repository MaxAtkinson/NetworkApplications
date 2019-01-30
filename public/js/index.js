const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';

socket.on('connect', handleConnect);
socket.on('message', handleMessage);
socket.on(`${room}Joined`, console.log);

function handleConnect() {
    console.log('Connected to socket.io server.');
}

function handleMessage(msg) {
    const $para = $('<p></p>').text(msg);
    $('#chat').append($para);
}

function handleSendMessage(e) {
    e.preventDefault();
    const $input = $('#input');
    const message = $input.val();
    if (message.trim() !== '') {
        console.log(message);
        socket.emit('message', message);
        $input.val('');
    }
}
