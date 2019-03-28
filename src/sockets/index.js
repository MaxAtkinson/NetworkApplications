/* sockets/index.js
/-----------------------------------------------------------------------------
// Author : Andrew Nolan, Max Atkinson ,Angus Cameron, Bruce Thomson    
//----------------------- ----------------------------------------------------
// Purpose: Node.js server side code for configuring the socket connection for
			each channel with the client. Only performs connection when user 
			has valid JWT auth token
			
	Requires: db jsonwebtoken
//-----------------------------------------------------------------------------
*/

import auth          from "../auth"
import jwt           from 'jsonwebtoken'
import db from '../db';


export default function configureSockets(io) {
    // Set up socket.io handlers
    io.on('connection', function (socket) {
        // https://socket.io/docs/emit-cheatsheet/
        var cookieString = socket.handshake.headers.cookie;
     //   console.log(cookieString);
        cookieString = extractAuthCookie(socket.handshake.headers.cookie);
       // console.log(cookieString);
        var user = checkUserAuth(cookieString);
        console.log(user);
        //console.log(user);

        if (user !== null)
        {
            // console.log(user);
            socket.join('defaultRoom', () => {
            io.to('defaultRoom').emit('defaultRoomJoined', 'someone joined the room');
            io.to('defaultRoom').emit('message', 'welcome!');
            socket.emit('test', { test: 'only you can see this' });
    
            socket.on('message', (msg) => {
                io.to(getChannel(socket)).emit('message', msg);
                console.log("M:" + msg);
                console.log('we are here');
               // console.log('...');
                //console.log(cookieString);
              //  console.log(user);
               // console.log(cookieString);
                //console.log('...');

                    var user = auth.decodeJWT(jwt, cookieString).payload;
                    console.log('the user is: ');
                    console.log(user.username);

         
                var usn = user.username
                var date = new Date()
                var timestamp = date.getTime()
                var dbo = db();
                var myobj ={channelID: getChannel(socket), message: msg, username: usn, timestamp: timestamp}

                dbo.collection("messages").insertOne(myobj, function (err, result) {
                    if (err) throw err;
                    //console.log(req.body);
                });
                // console.log(getChannel(socket));
                // console.log(msg);
            });
    
            socket.on('channelChange', (channel) => {
                socket.leaveAll();
                socket.join(channel, () => {
                    // console.log(getChannel(socket));
                    socket.emit('channelChanged', channel);
                });
            });
        });
        }
        
    });
}

function getChannel(socket) {
    return Object.keys(socket.rooms).find(r => r);
}

//checkUseAuth takes the JWT in string form and returns the user object with username and email
//if the JWT is valid and. Otherwise returns null.
function checkUserAuth(cookieString){
//     // Verify this is a valid JWT and then decode the JWT to get the user
    if(cookieString == null){
        return null;
    }

    if(auth.verifyJWT(jwt, cookieString))
    {
        
        var user = auth.decodeJWT(jwt, cookieString).payload;
         // Check that the user's JWT is valid in the redis database
        if (auth.redisClient().get(user.username, function(err,value) {
            if (err){
                // console.log("Redis Connection Failed");
                return;
                }
                else if (value != 'valid') {
                    // console.log("User does not have a valid JWT");
                    return null;
                }
                else
                {
                        console.log(user);
                        return user;
                }
            }));
    }
    else
    {
        // console.log('user not verified');
        return null;
    }
   
}

function extractAuthCookie(cookieString){
    var cookieName = "ChatAppToken=";
    var cookie;

     console.log(cookieString);

    if (typeof cookieString !== "undefined")
    {
        // Check that that the string contains the ChatApp token
        if (cookieString.indexOf(cookieName) !== -1)
        {
            // console.log("Passed");
            var startPosition = cookieString.indexOf(cookieName);

            cookie = cookieString.substring(startPosition + cookieName.length);
          //  console.log(cookie);
            var endPosition = cookie.indexOf(";");

            if (endPosition !== -1)
            {
                cookie = cookie.substring(0,endPosition);
            } 

        }
        else
        {   
            cookie = null;
            
        }
        return cookie;
        
    }

    return null;
}
