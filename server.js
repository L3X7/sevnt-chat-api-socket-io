var app = require('express')();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var global = require('./global');
var port = process.env.PORT || 8000;

server.listen(port, () => {
    console.log(`App listening port ${port}`);
});

require('./app/models/models');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var MessagePersonal = mongoose.model('MessagePersonal'),
    MessagePersonalRoom = mongoose.model('MessagePersonalRoom');

app.get('/test', (req, res) => {
    res.send('Test');
})

//Create connection
io.on('connection', function (socket) {
    //Join room
    socket.on('subscribe', function (room) {
        socket.join(room);
    });


    //Get the messages
    socket.on('get-messages-by-room', (query) => {
        //Find room and emit
        MessagePersonalRoom.find({
            $or: [
                { user_one: query.id_one, user_two: query.id_two },
                { user_two: query.id_one, user_one: query.id_two }
            ]
        })
            .exec(function (err, messagePersonalRoom) {
                if (err) {
                    io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 500, message: 'Error in transaction' });
                }
                else if (!messagePersonalRoom) {
                    io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 404, message: 'Messages not found' })
                }
                if (messagePersonalRoom.length) {
                    //If exist last messages
                    MessagePersonal.find({
                        message_personal_room: messagePersonalRoom[0]._id
                    })
                        .exec(function (error, messagePersonal) {
                            if (error) {
                                io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 500, message: 'Error in transaction' })
                            }
                            else if (!messagePersonal) {
                                io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 404, message: 'Messages not found' })

                            }
                            io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 200, message: 'Success', messagePersonalRoom: messagePersonalRoom, messagePersonal: messagePersonal })
                        });
                }
                else {
                    io.sockets.in(query.room_socket_io).emit('get-personal-messages', { status: 200, message: 'Success', messagePersonalRoom: messagePersonalRoom, messagePersonal: [] })
                }
            });
    });
});

mongoose.connect('mongodb://' + global.prodMongDb + '/' + global.mongoDb, { useNewUrlParser: true }, (err) => {
    if (err) {
        console.log(err);
    }
});

