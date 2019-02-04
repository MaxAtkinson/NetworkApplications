const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';
let $chat;
let $input;

class DomUtils {
    static scrollToBottom() {
        $chat.scrollTop($chat.prop('scrollHeight'));
    }

    static addChannelsToPanel(channels) {
        let $channel = $('<p/>');
        const $channelPanel = $('#channel-panel');

        channels.forEach((channel) => {
            $channel = $channel.clone()
                .text(channel.name)
                .attr('id', 'channel' + channel._id)
                .attr('class', 'channel');
            $channel.click(() => OutboundEventHandlers.handleChangeChannel(channel._id));
            $channelPanel.append($channel);
        });
    }

    static setActiveChannel(channelId) {
        const $allChannels = $('.channel');
        $allChannels.removeClass('active');
        const $channel = $('#channel' + channelId);
        $channel.addClass('active');
    }
}

class Http {
    static loadChannels(onLoad) {
        // Todo: Use $.ajax here and pass onLoad to its response handler
        onLoad([
            {
                _id: 1,
                name: 'Channel 1' // Mock data
            },
            {
                _id: 2,
                name: 'Channel 2'
            },
            {
                _id: 3,
                name: 'Channel 3'
            }
        ]);
    }

    static loadMessagesForChannel(channelId, onLoad) {
        // Todo: Use $.ajax here and pass onLoad to its response handler
        onLoad([
            {
                _id: 1,
                channelId: 1, // Mock data
                text: 'Hi'
            },
            {
                _id: 2,
                channelId: 1,
                text: 'Hello'
            },
            {
                _id: 3,
                channelId: 1,
                text: 'How are you?'
            }
        ]);
    }
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
    static handleChangeChannel(channelId) {
        socket.emit('channelChange', channelId);
        DomUtils.setActiveChannel(channelId);
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


$(function() {
    $chat = $('#chat');
    $input = $('#input');
    $input.focus();
    Http.loadChannels(DomUtils.addChannelsToPanel);
});

socket.on('connect', InboundEventHandlers.handleConnected);
socket.on('message', InboundEventHandlers.handleMessageReceived);
socket.on(`${room}Joined`, console.log);
