const socket = io.connect('http://localhost:3000');
const room = 'defaultRoom';
let $chat;
let $input;
let $globalchannelId;

class DomUtils {
    static scrollToBottom() {
        $chat.scrollTop($chat.prop('scrollHeight'));
    }

    static addChannelsToPanel(channels) {
        let $channel = $('<p/>').addClass('channel');
        const $channelPanel = $('#channel-panel');
        $channelPanel.empty();

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

    static addMessagesToChat(messages) {
        let $message = $('<p/>').addClass('message');
        const $chat = $('#chat');

        messages.forEach((message) => {
            $message = $message.clone()
                .text(message.username + ' : ' + message.text + ' : ' + message.time)
                .attr('id', 'message' + message._id);
            $chat.append($message);
        });


    }

    static setActiveChannel(channelId) {
        const $allChannels = $('.channel');
        const $channel = $('#channel' + channelId);
        $allChannels.removeClass('active');
        $channel.addClass('active');
        $globalchannelId = channelId;
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

    static updatecss(){

        $("#chat").css("height",$(window).height()-128);
        $('#channel-panel').css('height',$(window).height()-128)
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

    static loadMessagesForChannel(channelID,onLoad) {
        // Todo: Use $.ajax here and pass onLoad to its response handler

        // $.get('/channels/'+channelID+'/messages').done(function(data) {
        //     console.log(data);
        // }).fail(function(data) {
        //     console.log('Error: ' + data);
        // });


      $.ajax({
        type:       "GET",
        url:        "/channels/"+channelID+"/messages",
        dataType:   "json",
       // data:       channelID, //$("#channelForm").serialize(),


        success: function(data)
        {
            console.log(data);
            // When the status is 200, we have a valid username and password
            if (data.status == 200)
            {
               // $('#chat').append(<p> + data.status +"");

              // var i = 0;

              // console.log(data.result[i].message);
                 $chat.empty();

               for (var i = data.result.length-1; i>=0; i--) {

                
                var user = data.result[i].username;
                var ts = Number(data.result[i].timestamp);
                var date = new Date(ts)

                if(date.getUTCMinutes()<10){
                    var timeString = date.getHours() + ":" + +"0"+date.getUTCMinutes();
                }else{
                    var timeString = date.getHours() + ":" + date.getUTCMinutes(); 
                }
              
             
                var mess = data.result[i].message;

                   
                    // var display_txt = user + time +  + mess ;
                    // $chat.html(display_txt).css("color", "blue")
                  // $chat.append('<p>'  + data.result[i].username +data.result[i].timestamp+'</h2>'+ data.result[i].timestamp+ '<br/>' + data.result[i].message +'</p>');


              $chat.append(

             // '<div class="container"><p> <h2>'+user+'</h2>'+'<br/>'+mess+'</p><span class="time-right">'+ timeString +'</span></div>'

              // ' <div id="myDiv" name="myDiv" title="Example Div Element" style="color: #0900C4; font: Arial 12pt;border: 1px solid black;"><h5>'+user+'</h5><p>'+mess+'</p><p>Heres another content article right here.</p></div>'
              '<div class="container2"><p> <h2>'+user+'</h2>'+'<br/>'+mess+'</p><span class="time-right">'+ timeString +'</span></div>'

                           );




               }
               console.log(data.result.length);
               DomUtils.scrollToBottom();

               // $chat.append('<p>' + data.+ '</p>');


                console.log("apparantly it was successful");
            }
            // We have an invalid response to the username and password and display an error message to user
            else
            {  
                console.log("apparantly it was unsuccessful");
            }
        },
        error: function(data)
        {
            console.log("apparantly it was errory");
        }

    });
    
    
    }
}

class InboundEventHandlers {
    static handleConnected() {
        console.log('Connected to socket.io server.');
    }

    static handleMessageReceived(msg) {

        //jquery.empty $chat.empt. $chat.appent, Name time and message build div in jquery 
        // console.log('msg boi');
        // console.log(msg);
        // console.log('channel boi');
        // console.log($globalchannelId);
       // $chat.append('<p>' + msg + '</p>');
     
       //$.get('/channels/:id/messages',
        // $chat.append(
        //  '<div class="container2"><p> <h2>'+"username"+'</h2>'+'<br/>'+msg+'</p><span class="time-right">'+ "timeString" +'</span></div>'
        //  );
        Http.loadMessagesForChannel($globalchannelId,DomUtils.addMessagesToChat);
   //     DomUtils.updatecss();
      //  Http.loadChannels(DomUtils.addChannelsToPanel);
      // DomUtils.setActiveChannel($globalchannelId);


        /*
        const $para = $('</p>').text(msg);
        $chat.append($para);



                */
    }
}

class OutboundEventHandlers {
    static handleChangeChannel(channelId) {
        socket.emit('channelChange', channelId);
        DomUtils.setActiveChannel(channelId);
        Http.loadMessagesForChannel(channelId,DomUtils.addMessagesToChat);
    }

    static handleSendMessage(e) {
        //console.log('dskjjdsughdujgsijgdrtijhgfijhrtjhurhjtg');
        console.log("Message " + message);
        e.preventDefault();
        const message = $input.val();
        

        if (message.trim() !== '') {
            socket.emit('message', message);
            $input.val('');
           
        }
    }

    static logout()
    {
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

    // Update user details allows the user to change their username and password within the system
    static updateUserFormSubmit()
    {
        $.ajax({
            type:       "POST",
            url:        "auth/updateuser",
            dataType:   "json",
            data:       $("#updateUserForm").serialize(),
            success: function(data)
            {

            },
            error: function(data)
            {

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
                    console.log(data.message)
           
                // When the status is 200, there isn't a duplicate channel
                if (data.message == 200)
                {
                  //  $("#channel-modal").modal('hide');  
                    console.log('Channel Created');
                    Http.loadChannels(DomUtils.addChannelsToPanel);
                    $("#channel-modal").modal('hide');  
                    // Hide the login modal as we have a valid username and password response
                   
            
                    
                }
                // We have an invalid response to the username and password and display an error message to user
                else
                {  
                // console.log(data.status);
                console.log('SUcess Block')
                    $('#channelForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.message +"</div>");
                    Http.loadChannels(DomUtils.addChannelsToPanel);
                    console.log("Reloading channels")
                   
                }
            },
            error: function(data)
            {
                console.log('error block')

                $('#channelForm').append("<div class='alert alert-danger'><strong>Error: </strong>" + data.message +"</div>");
               
              //  alert(data.responseText);
            }

        });

    }
}

 function testAlert(){
    alert("test");
}


$(function main() {
    $chat = $('#chat');
    $input = $('#input');
    $input.focus();
    DomUtils.updatecss();
    Http.loadChannels(DomUtils.addChannelsToPanel);
    Http.checkLoggedIn();
    window.onresize = DomUtils.updatecss;
    //edit
    socket.on('connect', InboundEventHandlers.handleConnected);
    socket.on('message', InboundEventHandlers.handleMessageReceived);
    socket.on(`${room}Joined`, console.log);
    
});
