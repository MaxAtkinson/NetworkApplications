export function getChannel(socket) {
    return Object.keys(socket.rooms).find(r => r);
}
