const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';
let $chat;
let $input;

class DomUtils {
    static scrollToBottom() {
        $chat.scrollTop($chat.prop('scrollHeight'));
    }

    static addChannelsToPanel(channels) {
        let $channel = $('<p/>').addClass('channel');
        const $channelPanel = $('#channel-panel');

        channels.forEach((channel) => {
            $channel = $channel.clone()
                .text(channel.name)
                .attr('id', 'channel' + channel._id);
            $channel.click(() => OutboundEventHandlers.handleChangeChannel(channel._id));
            $channelPanel.append($channel);
        });

        if (channels.length > 0) {
            OutboundEventHandlers.handleChangeChannel(channels[0]._id);
        }
    }

    static addMessagesToChat(messages) {}

    static setActiveChannel(channelId) {
        const $allChannels = $('.channel');
        const $channel = $('#channel' + channelId);
        $allChannels.removeClass('active');
        $channel.addClass('active');
    }

    //showRegisterForm hides the login modal and shows the register modal 
    static showRegisterForm()
    {
        $("#login-modal").modal('hide');   
        $("#register-modal").modal('show');   
    }

}

class Http {
    static loadChannels(onLoad) {
        $.get('/channels', onLoad);
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
        // Http.loadMessagesForChannel(DomUtils.addMessagesToChat);
    }

    static handleSendMessage(e) {
        e.preventDefault();
        const message = $input.val();

        if (message.trim() !== '') {
            socket.emit('message', message);
            $input.val('');
        }
    }

    // Functions for submitting to the server user authentication ifno
    static loginFormSubmit()
    {
        // Submit the form with AJAX and then 
        $.ajax({
            type:       "POST",
            url:        "auth/login",
            dataType:   "json",
            data:       $("#loginForm").serialize(),
            success: function(data)
            {
                // When the status is 200, we have a valid username and password
                if (data.status == 200)
                {
                    // Reset the contents of the form incase this is used later


                    // Hide the login modal as we have a valid username and password response
                    $("#login-modal").modal('hide');   
                    document.getElementById('loginStatus').innerHTML = "My Profile";
                    
                }
                // We have an invalid response to the username and password and display an error message to user
                else
                {  
                    console.log(data);
                    $('#loginForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.success +"</div>");
                    //Reset the password field
                    $('#password').val(''); 
                }
            },
            error: function(data)
            {
                console.log(data);
                $('#loginForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + "AJAX Submission Failed" +"</div>");
                alert(data.responseText);
            }

        });
    }

    static registerFormSubmit()
    {
            // Submit the form with AJAX and then 
            $.ajax({
                type:       "POST",
                url:        "auth/register",
                dataType:   "json",
                data:       $("#registerForm").serialize(),
                success: function(data)
                {
                    // When the status is 200, we have a valid username and password
                    if (data.status == 200)
                    {
                        // Reset the contents of the form incase this is used later
    
    
                        // Hide the login modal as we have a valid username and password response
                        $("#register-modal").modal('hide');   
                        $("#success-register-modal").modal('show');
                        
                    }
                    // We have an invalid response to the username and password and display an error message to user
                    else
                    {  
                        console.log(data);
                        $('#registerForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.success +"</div>");
                        //Reset the password field
                        $('#registerPassword').val(''); 
                    }
                },
                error: function(data)
                {
                    console.log(data);
                    $('#registerForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + "AJAX Submission Failed" +"</div>");
                    alert(data.responseText);
                }
    
            });
    }

    static addchannel(){
        
        $.ajax({
            type:       "POST",
            url:        "channels",
            dataType:   "json",
            data:       $("#channelForm").serialize(),
            success: function(data)
            {
                // When the status is 200, there isn't a duplicate channel
                if (data.status == 200)
                {


                    // Hide the login modal as we have a valid username and password response
                    $("#channel-modal").modal('hide');   
                  //  document.getElementById('channelStatus').innerHTML = "My Profile";
                    
                }
                // We have an invalid response to the username and password and display an error message to user
                else
                {  
             //       console.log(data);
                    $('#channelForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.success +"</div>");
                }
            },
            error: function(data)
            {

                $('#channelForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.responseText +"</div>");
                
              //  alert(data.responseText);
            }

        });

    }
}


$(function main() {
    $chat = $('#chat');
    $input = $('#input');
    $input.focus();
    Http.loadChannels(DomUtils.addChannelsToPanel);
    socket.on('connect', InboundEventHandlers.handleConnected);
    socket.on('message', InboundEventHandlers.handleMessageReceived);
    socket.on(`${room}Joined`, console.log);
});
