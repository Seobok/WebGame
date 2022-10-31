const express = require('express')

function generateSerial() {
    var chars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        serialLength = 10,
        randomSerial = "",
        i,
        randomNumber;
    
    for (i = 0; i < serialLength; i = i + 1) {
        
        randomNumber = Math.floor(Math.random() * chars.length);
        
        randomSerial += chars.substring(randomNumber, randomNumber + 1);
        
    }

    return randomSerial;
}

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost"
    }});

app.use(express.static('public'))

app.post('/createRoom', (request, response) => {
    id = generateSerial()
    response.redirect('/room?roomId='+id)
})

app.listen(80, () => {});

server.listen(52273);

io.on('connection', (socket) => {
    const roomId = socket.handshake.query.roomId

    socket.join(roomId)

    socket.on('roomMemberList', (roomId) => {
        io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size)
    
        console.log(io.of('/').adapter.rooms.get(roomId).size)
    })
})