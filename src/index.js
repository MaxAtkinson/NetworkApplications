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
import configureAuth from './auth'

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
configureAuth(app, jwt, dbUrl);

// Serve the socket.io client from node_modules
app.get('/socket.io-client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../node_modules/socket.io-client/dist/socket.io.min.js'));
});

app.get('/channels', (req, res) => {
    // TODO: DB logic to fetch channels
    res.json([
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
});

app.post('/channels', (req, res) => {
    // TODO: DB logic to add channel
    /* 
        db.channels.insert(req.body.channelname, (err, result) => {
            if (!err) {
                db.channels.find({req.body.channelname: channelname},(err, results) => {
                    if (!err){
                        res.json(err);
                    }
                    else{
                        res.status(404);
                        res.json(err);
                    }
                })
                if(results.length > 0){
                    res.json('Duplicate Channel');
                }
                else{
                    res.json(result);
                }
                
            } else {
                res.status(400);
                res.json(err);
            }
        });
    */
   res.send('not implemented');
});

app.get('/channels/:id/messages', (req, res) => {
    // TODO: DB logic to get last 20 messages from channel with id :id
    /* 
        const channelId = req.params.id;
        db.messages.find({ channel._id: channelId }, { limit: 20, sort: 'timestamp' }, (err, results) => {
            if (!err) {
                res.json(results);
            } else {
                res.status(404);
                res.json(err);
            }
        });
    */
   
   res.send('not implemented');
});

// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
