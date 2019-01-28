import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import socketio from 'socket.io';

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

// Set up socket.io handlers
io.on('connection', function (socket) {
    socket.on('name entered', (name) => {
        socket.name = name;
        socket.emit('userJoined', socket.name);
    });
});

// Listen on our port
app.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}`);
});
