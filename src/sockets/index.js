import auth          from "../auth"
import jwt           from 'jsonwebtoken'


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
        if (user !== null)
        {
            // console.log(user);
            socket.join('defaultRoom', () => {
            io.to('defaultRoom').emit('defaultRoomJoined', 'someone joined the room');
            io.to('defaultRoom').emit('message', 'welcome!');
            socket.emit('test', { test: 'only you can see this' });
    
            socket.on('message', (msg) => {
                io.to(getChannel(socket)).emit('message', msg);
              //  console.log(this.username);
                
                 console.log(msg);
            }.bind({username : user}));
    
            socket.on('channelChange', (channel) => {
                socket.leaveAll();
                socket.join(channel, () => {
                    console.log(getChannel(socket));
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
    // Verify this is a valid JWT and then decode the JWT to get the user
    if(cookieString == null){
        return null;
    }

    if(auth.verifyJWT(jwt, cookieString))
    {
        
        var user = auth.decodeJWT(jwt, cookieString).payload;

         // Check that the user's JWT is valid in the redis database
        if (auth.redisClient().get(user.username, function(err,value) {
            if (err){
                console.log("Redis Connection Failed");
                return;
                }
                else if (value != 'valid') {
                    console.log("User does not have a valid JWT");
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
        return null;
    }
}

function extractAuthCookie(cookieString){
    var cookieName = "ChatAppToken=";
    var cookie;

    // console.log(cookieString);

    if (cookieString !== "undefined")
    {
        // Check that that the string contains the ChatApp token
        if (cookieString.indexOf(cookieName) !== -1)
        {
            console.log("Passed");
            var startPosition = cookieString.indexOf(cookieName);

            cookie = cookieString.substring(startPosition + cookieName.length);
            console.log(cookie);
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