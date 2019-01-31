import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import socketio from 'socket.io';
import configureSockets from './sockets';

// Init web app
const app = express();
const server = http.Server(app)
const io = socketio.listen(server);
configureSockets(io);

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

// Listen on our port
server.listen(app.get('port'), () => {
    console.log(`Listening at localhost:${app.get('port')}/`);
});
