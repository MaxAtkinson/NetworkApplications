const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';

class InboundEventHandlers {
    static handleConnected() {
        console.log('Connected to socket.io server.');
    }

    static handleMessageReceived(msg) {
        const $para = $('<p></p>').text(msg);
        $('#chat').append($para);
    }
}

class OutboundEventHandlers {
    static handleChangeChannel(channelName) {

    }

    static handleSendMessage(e) {
        e.preventDefault();
        const $input = $('#input');
        const message = $input.val();
        if (message.trim() !== '') {
            console.log(message);
            socket.emit('message', message);
            $input.val('');
        }
    }
}

socket.on('connect', InboundEventHandlers.handleConnected);
socket.on('message', InboundEventHandlers.handleMessageReceived);
socket.on(`${room}Joined`, console.log);
