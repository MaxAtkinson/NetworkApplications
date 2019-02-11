import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import session from 'express-session';
import socketio from 'socket.io';

import configureSockets from './sockets';

// Init web app
const app = express();
const server = http.Server(app);
const io = socketio.listen(server);
const db_url = 'mongodb://localhost:27017/chatapp';
configureSockets(io);

// Set app props
app.set('port', 3000);

// Set up middleware - we want at least static file serving and json parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

console.log(__dirname);

// Serve the socket.io client from node_modules
app.get('/socket.io-client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../node_modules/socket.io-client/dist/socket.io.min.js'));
});

app.get('/channels', (req, res) => {
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


import configureAuth from './auth'
configureAuth(app,path,bodyParser,express,bcrypt,session,db_url);


// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
