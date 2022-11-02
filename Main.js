const express = require('express')

function generateSerial() { //방 시리얼 넘버 생성
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

function generateUserNickname(){
    var adjective = ['번듯한', '멋진', '화려한', '우울한', '슬픈', '기쁜', '힘든', '포기하고 싶은'],
    noun = ['호랑이', '사자', '인간', '쥐', '나무늘보', '너구리', '바위', '박명수', '토끼'],
    randomName="",
    randomNumber;

    randomNumber = Math.floor(Math.random() * adjective.length);
    randomName += adjective[randomNumber];
    randomName += " ";
    randomNumber = Math.floor(Math.random() * noun.length);
    randomName += noun[randomNumber];

    return randomName;
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

var addNick = new Map();

io.on('connection', (socket) => {
    const roomId = socket.handshake.query.roomId
    const userId = socket.id

    socket.join(roomId)

    io.to(userId).emit('userNick', addNickname = generateUserNickname())

    if(!addNick.has(roomId)) {
        addNick.set(roomId, new Array());
    }
    addNick.get(roomId).push(addNickname)
    
    socket.on('roomMemberList', (roomId) => {
        io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size, addNick.get(roomId))
    })

    socket.on('disconnect', () => {
        addNick.get(roomId).splice(addNick.get(roomId).indexOf(addNickname), 1)
        if(io.of('/').adapter.rooms.has(roomId))
            io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size, addNick.get(roomId))
    })
})