export function getChannel(socket) {
    return Object.keys(socket.rooms).find(r => r);
}

export default function configureSockets(io) {
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
}
