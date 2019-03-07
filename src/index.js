import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
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

app.get('/othermessages',(req, res) => {
    var dbo = db();
    
     dbo.collection("messages").find({_id : req.query}).toArray(function (err, result) {
         if (err) throw err;
         console.log(result);
         res.json(result);
     });

});

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
                console.log(req.body);
            });

            res.sendStatus(200)
        }
        else {
            res.send("Duplicate Channel, please pick a unique name");
        }
    });
    //code to emmit new channel   
});

// app.get('/channels/:id/messages', (req, res) => {

// //==========================
//     // TODO: DB logic to get last 20 messages from channel with id :id
//     var dbo = db();

//     const channelId = req.body.channelId;
//     var myobj = {id: channelId, message:{}};
//     //{_id: cid, name: cnm, message:{username: usn, body: msg}};

//     // dbo.collection("channels").find(myobj,{ limit: 20 }).toArray(function (err, result) {
//     //     if (err) throw err;
//     //     console.log(result);
//     //     res.json(result);
//     // });

// //====================


//     // dbo.collection("channels").find({}).toArray(function(err, result) {
//     //     if (err) throw err;
//     //     console.log(result);

//     //   res.json(result);
//     //   });

//     // const channelId = req.params.id;
//     // db.messages.find({ channel: channelId }, { limit: 20}, (err, results) => {
//     //     if (!err) {
//     //         res.json(results);
//     //     } else {
//     //         res.status(404);
//     //         res.json(err);
//     //     }
//     // });

//     res.json(myobj);
//     //res.sendStatus(200);
// });


app.post('/channels/:id/messages', (req, res) =>{
    
//     var cid = req.body.channelId;
//     var cnm = req.body.channelname;
//     var usn = req.body.username;
//     var msg = req.body.message;

//     myobj ={_id: cid, name: cnm, message:{username: usn, body: msg}};


//     /*
//     var message = new Message(req.body)
//     message.save(err =>{
//         if(err)
//             sendStatus(500)

//             Message.findOne({message: 'badword'}, (err, censored) =>{
//                 if(censored){
//                     console.log('censored words found')
//                     Message.deleteOne({_id: censored.id}, (err) =>{
//                         console.log('removed censored message') 
//                     })
//                 }
//             })

//        // messages.push(req.body)
//         io.emit('message', req.body)
//         res.sendStatus(200)
//     })
// */
   
});

// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
