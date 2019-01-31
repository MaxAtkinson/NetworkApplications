const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';
let $chat;
let $input;

$(function() {
    $chat = $('#chat');
    $input = $('#input');
    $input.focus();
});

class DomUtils {
    static scrollToBottom() {
        $chat.scrollTop($chat.prop('scrollHeight'));
    }
}

class Http {
    static loadChannels() {}
    static loadMessagesForChannel(channel) {}
}

class InboundEventHandlers {
    static handleConnected() {
        console.log('Connected to socket.io server.');
    }

    static handleMessageReceived(msg) {
        const $para = $('</p>').text(msg);
        $chat.append($para);
        DomUtils.scrollToBottom();
    }
}

class OutboundEventHandlers {
    static handleChangeChannel(channel) {
        socket.emit('channelChange', channel);
    }

    static handleSendMessage(e) {
        e.preventDefault();
        const message = $input.val();

        if (message.trim() !== '') {
            socket.emit('message', message);
            $input.val('');
        }
    }
}

socket.on('connect', InboundEventHandlers.handleConnected);
socket.on('message', InboundEventHandlers.handleMessageReceived);
socket.on(`${room}Joined`, console.log);
