const express = require('express');
const { get } = require('http');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { table } = require('console');

function generateSerial() {     //방 시리얼 넘버 생성
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

function generateUserNickname(){    //무작위 닉네임 생성
    var adjective = ['번듯한', '멋진', '화려한', '우울한', '슬픈', '기쁜', '힘든', '포기하고 싶은', '조용한', '시끄러운', '재밌는', '노잼'],
    noun = ['호랑이', '사자', '인간', '쥐', '나무늘보', '너구리', '바위', '박명수', '토끼', '돼지', '아르마딜로', '사냥꾼', '마법사'],
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

app.use(express.static('public'))       //서버생성시 public에 있는 index를 띄움
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.post('/createRoom', (request, response) => {        //createRoom form에서 호출 받으면 랜덤 roomId를 query형태로 넘김
    id = generateSerial()
    getroomName = request.body.roomName
    getcategory = request.body.category
    gettimeout = request.body.timeout
    getisPrivate = request.body.isPrivate
    response.redirect('/room?roomId='+id+'&roomName='+getroomName+'&category='+getcategory+'&timeout='+gettimeout+'&isPrivate='+getisPrivate)
})

var RoomList = new Map();                //Nickname을 저장하는 배열 <roomId(String), NicknameArr(Array)>

getTableList = function() {
    var tableList ="'";
    for([index, Room] of RoomList.entries())
    {
        if(Room.isPrivate == "false")
        {
            tableList += '<tr class = "tr"><td class = "tdID" style = "display : none;">' + index + '</td><td>' + Room.roomName + '</td><td>' +Room.category+ '</td><td>' +String(Room.timeout)+ '</td><td>' + Room.nicknames.length+'/4</td></tr>'
        }
    }
    tableList += "'"

    return tableList;
}

app.post('/joinRoom', (requset, response) => {
    tableList = getTableList()
    response.send(`
    <!DOCTYPE html>
    <html>
        <head>
            <script>
                window.onload = function(){
                    table = document.getElementById("table")
                    table.innerHTML += ` + tableList +  `
                    console.log(`+ tableList+ `)
                    
                    tr = document.getElementsByClassName("tr")
                    for(let i =0; i<tr.length; i++)
                    {
                        tr[i].onclick = function() {
                            td = tr[i].getElementsByTagName('td')
                            window.location.replace("room/?roomId=" + td[0].innerHTML + "&roomName=" + td[1].innerHTML + "&category=" + td[2].innerHTML + "&timeout=" + td[3].innerHTML)
                        }
                    }
                }
            </script>
        </head>
        <body>
            <table style="border: 1px solid;" id="table">
                <tr>
                    <td style = "display:none;" >RoomID</td>
                    <td>RoomName</td>
                    <td>Category</td>
                    <td>Timeout</td>
                    <td>UserCount</td>
                </tr>
            </table>
        </body>
    </html>`)
})

app.listen(80, () => {});               //express 서버생성

server.listen(52273);                   //socket 서버 생성

io.on('connection', (socket) => {       //접속시
    const roomId = socket.handshake.query.roomId;
    const userId = socket.id;

    korean = new Array();
    pen = new Array();
    instrument = new Array();
    food = new Array();
    electronics = new Array();
    sport = new Array();

    socket.join(roomId);

    io.to(userId).emit('userNick', addNickname = generateUserNickname());       //Nickname부여

    socket.nickname = addNickname;
    socket.roomMaster = Boolean(false);                                         //socket property : nickname, roomMaster(필요한가?)

    if(!RoomList.has(roomId)) {                                                  //방이 존재하지 않는다면 (처음 들어왔다면)
        RoomList.set(roomId, {
            roomName : "",
            nicknames : [],
            currnetPlayer : "",
            currnetPlayerIndex : 0,
            roomMaster : socket.roomMaster,
            userScore : [],
            readyStatus : [],
            category : "",
            timeout: 0,
            answer : "",
            round : 0,
            isPrivate: false,
        });                                                                     //addNick Map에 roomId 추가
        socket.roomMaster = true;                                               //roomMaster 지정
    }

    RoomList.get(roomId).roomName = socket.handshake.query.roomName
    RoomList.get(roomId).category = socket.handshake.query.category
    RoomList.get(roomId).timeout = Number(socket.handshake.query.timeout)
    RoomList.get(roomId).isPrivate = socket.handshake.query.isPrivate
    console.log(RoomList.get(roomId).isPrivate)

    if(socket.roomMaster)
    {
        io.to(userId).emit('changeCategoryTimeoutList', RoomList.get(roomId).category, String(RoomList.get(roomId).timeout))
    }
    else
    {
        io.to(userId).emit('changeCategoryTimeout', RoomList.get(roomId).category, String(RoomList.get(roomId).timeout))
    }

    while(RoomList.get(roomId).nicknames.indexOf(socket.nickname) >= 0)
    {
        io.to(userId).emit('userNick', addNickname = generateUserNickname());
        socket.nickname = addNickname;
    }
   
    RoomList.get(roomId).nicknames.push(socket.nickname)                                   //생성되어있는 방에 닉네임 추가
    RoomList.get(roomId).userScore.push(0)
    RoomList.get(roomId).readyStatus.push(false)

    if(RoomList.get(roomId).nicknames.length > 4)
    {
        io.to(userId).emit('over')
    }

    io.to(roomId).emit('findRoomMaster', RoomList.get(roomId).nicknames[0]);               //사람이 들어올때 마다 roomMaster에 대한 정보 제공

    for(let i = 1 ; i < RoomList.get(roomId).readyStatus.length; i++)
    {
        io.to(roomId).emit('changeReadyImage', i, RoomList.get(roomId).readyStatus[i])
    }

    function nextPlayer() {
        const previousPlayer = RoomList.get(roomId).currnetPlayer
        RoomList.get(roomId).currnetPlayerIndex = RoomList.get(roomId).currnetPlayerIndex - 1
        if(RoomList.get(roomId).currnetPlayerIndex==-1)
        {
            RoomList.get(roomId).round++;
            RoomList.get(roomId).currnetPlayerIndex = RoomList.get(roomId).nicknames.length-1
        }
        if(RoomList.get(roomId).round == 3)
        {
            //게임종료
        }
        RoomList.get(roomId).currnetPlayer = RoomList.get(roomId).nicknames[RoomList.get(roomId).currnetPlayerIndex]
        io.to(roomId).emit('next', previousPlayer, RoomList.get(roomId).currnetPlayer)
    }

    socket.on('roomMemberList', (roomId) => {                                                           //roomMemberList를 호출 시
        io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size, RoomList.get(roomId).nicknames) //userCount형태로 usercount와 nicknameArray를 제공 / 이후 분리가 필요해 보임
    })

    socket.on('gameStart', () => {                                              //방장이 게임시작 버튼을 누르면
        if(RoomList.get(roomId).nicknames.length == 1)
        {
            io.to(roomId).emit('requireMorePlayer')
        }
        else
        {
            RoomList.get(roomId).currnetPlayerIndex = 0
            RoomList.get(roomId).currnetPlayer = RoomList.get(roomId).nicknames[RoomList.get(roomId).currnetPlayerIndex]
            io.to(roomId).emit('setBrowser', RoomList.get(roomId).currnetPlayer)    //브라우저 설정 이벤트 호출
        }
        
    })

    socket.on('nextPlayer', () => {
        nextPlayer();
    })

    socket.on('message', (msg, time) => {
        if(msg != "" && msg == RoomList.get(roomId).answer && socket.nickname != RoomList.get(roomId).currnetPlayer)
        {
            var addScore = Math.floor(time/10)*10;
            RoomList.get(roomId).userScore[RoomList.get(roomId).nicknames.indexOf(socket.nickname)] += addScore;            
            socket.emit('calScore', RoomList.get(roomId).userScore[RoomList.get(roomId).nicknames.indexOf(socket.nickname)]);
            RoomList.get(roomId).answer = ""
            nextPlayer();
        }        
        io.to(roomId).emit('message', msg);
    });

    socket.on('changeCategory', (currentCategory) => {
        RoomList.get(roomId).category = currentCategory
        socket.to(roomId).emit('changeCategoryTimeout', RoomList.get(roomId).category, String(RoomList.get(roomId).timeout))
    })

    socket.on('changeTimer', (currentTime) => {
        RoomList.get(roomId).timeout = currentTime
        socket.to(roomId).emit('changeCategoryTimeout', RoomList.get(roomId).category, String(RoomList.get(roomId).timeout))
    })

    socket.on('changeReady', (ready) => {
        var allReady = true;
        RoomList.get(roomId).readyStatus[RoomList.get(roomId).nicknames.indexOf(socket.nickname)] = ready

        io.to(roomId).emit('changeReadyImage', RoomList.get(roomId).nicknames.indexOf(socket.nickname), ready)

        for(let i=1;i<RoomList.get(roomId).readyStatus.length;i++)
        {
            if(RoomList.get(roomId).readyStatus[i] == false)
            {
                allReady = false;
            }
        }
        io.to(roomId).emit('checkReady', allReady);
    })

    socket.on('waitingroomMessage', (msg) => {
        io.emit('waitingroomMessage', msg);
    });

    socket.on('line', (data) => {
        io.to(roomId).emit('line', data)
    })

    socket.on('stop', () =>{
        socket.to(roomId).emit('stop')
    })

    socket.on('undo', () =>{
        socket.to(roomId).emit('undo')
    })

    socket.on('clear', () =>{
        socket.to(roomId).emit('clear')
    })

    socket.on('wordCategory', (data, time) => {
        RoomList.get(roomId).category = data
        
        socket.to(roomId).emit('wordList', data, time);
    })

    socket.on('choicedWord',(data) => {
        RoomList.get(roomId).answer = data;
        socket.to(roomId).emit('choicedWord2', data)
    })

    socket.on('newRoomMasterChangeList', () =>{
        io.to(userId).emit('changeCategoryTimeoutList', RoomList.get(roomId).category, String(RoomList.get(roomId).timeout))
    })

    socket.on('getWords', () => {
        var words = []
        var category = RoomList.get(roomId).category

        if(category == "korean") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * korean.length);
                words.push(korean[randomNumber])

                korean.splice(randomNumber, 1)
            }
        }
        else if (category == "pen") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * pen.length);
                words.push(pen[randomNumber])

                pen.splice(randomNumber, 1)
            }
        }
        else if (category == "instrument") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * instrument.length);
                words.push(instrument[randomNumber])

                instrument.splice(randomNumber, 1)
            }
        }
        else if (category == "food") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * food.length);
                words.push(food[randomNumber])

                food.splice(randomNumber, 1)
            }
        }
        else if (category == "electronics") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * electronics.length);
                words.push(electronics[randomNumber])

                electronics.splice(randomNumber, 1)
            }
        }
        else if (category == "sport") {
            for(var i = 0 ; i < 3 ; i++)
            {
                randomNumber = Math.floor(Math.random() * sport.length);
                words.push(sport[randomNumber])

                sport.splice(randomNumber, 1)
            }
        }

        io.to(roomId).emit('setWords', words)
    })

    socket.on('wordChoiced', () => {
        socket.to(roomId).emit('wordChoiced2');
    })

    socket.on('sendCSV', (data) => {
        var allRows = data.split(/\r?\n|\r/);
        for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
            var rowCells = allRows[singleRow].split(',');
            if(Math.floor(rowCells[0]/1000) == 1)
            {
                korean.push(rowCells[1])
            }
            else if(Math.floor(rowCells[0]/1000) == 2)
            {
                pen.push(rowCells[1])
            }
            else if(Math.floor(rowCells[0]/1000) == 3)
            {
                instrument.push(rowCells[1])
            }
            else if(Math.floor(rowCells[0]/1000) == 4)
            {
                food.push(rowCells[1])
            }
            else if(Math.floor(rowCells[0]/1000) == 5)
            {
                electronics.push(rowCells[1])
            }
            else if(Math.floor(rowCells[0]/1000) == 6)
            {
                sport.push(rowCells[1])
            }
        }
    })

    socket.on('disconnect', () => {                                             //접속이 종료될 때
        var removeIndex = RoomList.get(roomId).nicknames.indexOf(socket.nickname)
        RoomList.get(roomId).nicknames.splice(removeIndex, 1)     //addNick Map에서 해당 유저 nickName 제거
        RoomList.get(roomId).userScore.splice(removeIndex, 1)
        RoomList.get(roomId).readyStatus.splice(removeIndex, 1)
        if(io.of('/').adapter.rooms.has(roomId)) {                                        //roomId가 존재하면 (남은 사람이 존재하여 방이 유지되면)
            io.to(roomId).emit('roomListClear')
            io.to(roomId).emit('userCount', io.of('/').adapter.rooms.get(roomId).size, RoomList.get(roomId).nicknames);    //남은 usercount와 nicknameArray를 제공
            io.to(roomId).emit('findRoomMaster', RoomList.get(roomId).nicknames[0]);                  //변경되었을 수 있기 때문에 roomMaster에 대한 정보 다시 제공
            
            for(let i = 1 ; i < RoomList.get(roomId).readyStatus.length; i++)
            {
                io.to(roomId).emit('changeReadyImage', i, RoomList.get(roomId).readyStatus[i])
            }

        }
        else {                                                                          //남은 사람이 존재하지 않는다면
            RoomList.delete(roomId)                                                      //roomId 제거
        }
    })
})