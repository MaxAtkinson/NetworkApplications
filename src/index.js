import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import session from 'express-session';
import jwt from 'jsonwebtoken'
import socketio from 'socket.io';
import cookieParser from 'cookie-parser';
// TODO: db module then:
// import db from './db';
import configureSockets from './sockets';
import auth from './auth'
import db from './db';



// Init web app
const app = express();
const server = http.Server(app);
const io = socketio.listen(server);
const dbUrl = 'mongodb://localhost:27017/chatapp';

// Set app props
app.set('port', 3000);

// Set up middleware - we want at least static file serving and json parsing middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(methodOverride());
app.use(auth.logErrors);

configureSockets(io);
auth.configureAuth(app, jwt, dbUrl);

// Serve the socket.io client from node_modules
/*app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.xhtml'));
});
*/

// Serve the socket.io client from node_modules
app.get('/socket.io-client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../node_modules/socket.io-client/dist/socket.io.js'));
});

app.get('/channels', (req, res) => {
    var dbo = db();

    dbo.collection("channels").find({}).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.json(result);
    });
});

// app.get('/messages',(req, res) => {
//     var dbo = db();
//      dbo.collection("messages").find({_id : require('url').parse(req.url).query}).toArray(function (err, result) {
//          if (err) throw err;
//          console.log(result);
//          res.json(result);
//      });

// });

app.post('/channels', (req, res) => {

    var dbo = db();
    var myobj = { name: req.body.channelname };
    

    dbo.collection("channels").find(myobj).toArray(function (err, result) {
        if (err) {
            throw err
        }
        else if (result.length == 0) {

            dbo.collection("channels").insertOne(myobj, function (err, result) {
                if (err) throw err;
               // console.log(req.body);
            });
            
            res.json({message: 200});
        }
        else {
            res.json({message: "Channel name taken! Please pick a unique channel name."});
        }
    });
    //code to emmit new channel   
});


function invalidJWTHandler(err,req,res,next)
{
    if (req.xhr)
    {
        res.status(500).send({error: "Invalid JWT"});
    }
    console.error(err.stack);


}

app.get('/channels/:id/messages', (req, res) =>{
    
//res.send(req.params);
var dbo = db();
var queryID = req.params.id;
console.log(queryID)
var dbquery = {channelID: queryID}
dbo.collection("messages").find(dbquery).limit(20).sort( { timestamp: -1 } ).toArray(function (err, result) {
    if (err) throw err;
  
    res.json({result, status: 200});

    // console.log(result)
});

//console.log(req.body.channelId)
   
});

// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
