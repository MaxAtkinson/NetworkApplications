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

    static showLoginForm()
    {
        $("#unauth-modal").modal('hide');   
        $("#login-modal").modal('show');   
    }

    //enableUserAuthElements function enables the channel select buttons, message sending buttons etc.
    // I.e. the change when a user becomes authenticated within the system.
    static enableUserAuthElements(user)
    {
        // Input is the message editing box.
        $("#input").prop('disabled', false);

        // Disable the send message button
        $("#send-btn").prop('disabled', false);

        // Disable the add channel button
        $("#channel-button").prop('hidden', false);

        // Add logged in a user element

        // Change the login button to a logout button
        $("#logout-btn").prop('hidden', false);
        $("#login-btn").prop('hidden', true);
    }

    //disableUserAuthElements 
    static disableUserAuthElements()
    {
        // Show a modal which can not be removed
        $("#unauth-modal").modal('show');   

        // Input is the message editing box.
        $("#input").prop('disabled', true);

        // Disable the send message button
        $("#send-btn").prop('disabled', true);

        // hide the add channel button
        $("#channel-button").prop('hidden', true);

        // Change the Logout Button to login button
        $("#logout-btn").prop('hidden', true);
        $("#login-btn").prop('hidden', false);
    }

}

class Http {
    static loadChannels(onLoad) {
        $.get('/channels', onLoad);
    }

    // Calling a AJAX get to check for the 
    static checkLoggedIn(onLoad) {

        // Submit the form with AJAX and then 
        $.ajax({
            type:       "GET",
            url:        "auth/verifyJWT",
            success: function(data)
            {
                // When the status is 200, we have a valid response. I.e.
                // No server errors. 
                if (data.status == 200)
                {
                    // We still need to check that the user variable is not undefined. I.e.
                    if (!('user' in data))
                    {
                        DomUtils.disableUserAuthElements();
                        console.log("User unauthenticated");
                    }
                    // The user has a valid JWT token and therefore is authenticated.
                    // User logged in
                    else
                    {  
                        console.log(data);
                        console.log("User authenticated");
                        DomUtils.enableUserAuthElements(data.user);
                    }
                }
                else
                {
                    console.log("User unauthenticated");
                    DomUtils.disableUserAuthElements();
                }
            },
            error: function(data)
            {
                // We disable DOM elements for sending messages
                DomUtils.disableUserAuthElements();
                console.log("AJAX Response Invalid");

            }

        });
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

    static logout()
    {
        alert("Do you want to logout");

        $.ajax({
            type: "POST",
            url:  "auth/logout",
            success: function(data)
            {
                // When the POST is successful. I.e. code 200. Then we've been successfully logged out.
                // As the server needs to note that the JWT is not valid no more, eventhough it stil has
                // time to live. I..e Blacklist
                if (data.status == 200)
                {
                    console.log("Logout succcessful");
                    DomUtils.disableUserAuthElements();
                    
                    // Delete the ChatApp JWT Token as this is what is identifiyign users. This is stored as a cookie
                    // The server should have blacklisted it anyway
                    document.cookie = "ChatAppToken= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
                }
                // The user was never authenticated or had a valid JWT. Therefore we assume that they are logged out.
                else
                {
                    console.log("Error: " + data.success);
                    DomUtils.disableUserAuthElements();
                    
                    // Delete the ChatApp JWT Token as this is what is identifiyign users. This is stored as a cookie
                    // The server should have blacklisted it anyway
                    document.cookie = "ChatAppToken" + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                }
            },
            error : function(data)
            {
                console.log("AJAX request error");
            }
        
        });
    }

    // Functions for submitting to the server user authentication ifno
    static loginFormSubmit()
    {
        // Remove any previous error message bootstrap alerts
        // from the DOM
        if (document.getElementById('loginError'))
        {
            $('#loginError').remove();
        }

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
                    // Reset the contents of the form since it may be used later


                    // Hide the login modal as we have a valid username and password response
                    $("#login-modal").modal('hide'); 
                    DomUtils.enableUserAuthElements();
                }
                // We have an invalid response to the username and password and display an error message to user
                else
                {  
                    console.log(data);
                    $('#loginForm').append("<div class='alert alert-danger' id='loginError'><strong>Error: </strong>" + data.success +"</div>");
                    //Reset the password field
                    $('#password').val(''); 
                }
            },
            error: function(data)
            {
                console.log(data);
                $('#loginForm').append("<div class='alert alert-danger' id='loginError'><strong>Error: </strong>" + "AJAX Submission Failed" +"</div>");
                alert(data.responseText);
            }

        });
    }

    static registerFormSubmit()
    {
            // Remove any previous error message bootstrap alerts
            // from the DOM
            if (document.getElementById('registerError'))
            {
                $('#registerError').remove();
            }

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
                        $('#registerForm').append("<div class='alert alert-danger'  id='registerError'><strong>Error: </strong>" + data.success +"</div>");
                        //Reset the password field
                        $('#registerPassword').val(''); 
                        $('#registerConfir')
                    }
                },
                error: function(data)
                {
                    console.log(data);
                    $('#registerForm').append("<div class='alert alert-danger' id='registerError'><strong>Error: </strong>" + "AJAX Submission Failed" +"</div>");
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
    Http.checkLoggedIn();
    socket.on('connect', InboundEventHandlers.handleConnected);
    socket.on('message', InboundEventHandlers.handleMessageReceived);
    socket.on(`${room}Joined`, console.log);
});
