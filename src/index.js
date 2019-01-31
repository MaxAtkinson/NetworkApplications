import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import socketio from 'socket.io';
import { getChannel } from './sockets';

// Init web app
const app = express();
const server = http.Server(app)
const io = socketio.listen(server);

// Set app props
app.set('port', 3000);

// Set up middleware - we want at least static file serving and json parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Serve the socket.io client from node_modules
app.get('/socket.io-client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../node_modules/socket.io-client/dist/socket.io.min.js'));
});

// Set up socket.io handlers
io.on('connection', function (socket) {
    // https://socket.io/docs/emit-cheatsheet/

    socket.join('defaultRoom');
    io.to('defaultRoom').emit('defaultRoomJoined', 'someone joined the room');
    io.to('defaultRoom').emit('message', 'welcome!');
    socket.emit('test', { test: 'only you can see this' });

    socket.on('message', (msg) => {
        io.to(getChannel(socket)).emit('message', msg);
    });

    socket.on('channelChange', (channel) => {
        socket.leaveAll();
        socket.join(channel, () => {
            console.log(getChannel(socket));
        });
    });
});

// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
