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

io.on('connection', (socket) => {                                               //접속할때마다 실행
    const roomId = socket.handshake.query.roomId                                    //접속한 주소의 방ID
    const userId = socket.id                                                        //신호를 보낸 user의id

    socket.userNickname = generateUserNickname();                                   //userNickname property추가

    socket.join(roomId)

    io.to(userId).emit('userNick', socket.userNickname)                         //닉네임을 넘겨줌
    
    socket.on('roomMemberList', (roomId) => {                                   //
        io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size)  //roomMember의 수를 넘겨줌

        io.to(roomId).emit('userList' , io.of('/').adapter.rooms.get(roomId))
    })
})