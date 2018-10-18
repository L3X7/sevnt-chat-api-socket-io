const app = require('express')();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const global = require('./global');
const port = process.env.port || 8080;

require('./app/models/models');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var MessagePersonal = mongoose.model('MessagePersonal'),
    MessagePersonalRoom = mongoose.model('MessagePersonalRoom');


app.get('/api/message-personal-service/get-messages-by-id', (req, res) => {
    //Find room 
    MessagePersonalRoom.find({
        $or: [
            { user_one: req.query.id_one, user_two: req.query.id_two },
            { user_two: req.query.id_one, user_one: req.query.id_two }
        ]
    })
        .exec(function (err, messagePersonalRoom) {
            if (err) {
                io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 500, message: 'Error in transaction' })
                res.sendStatus(500);
            }
            else if (!messagePersonalRoom) {
                io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 404, message: 'Messages not found' })
                res.sendStatus(404);
            }
            if (messagePersonalRoom.length) {
                //If exist last messages
                MessagePersonal.find({
                    message_personal_room: messagePersonalRoom[0]._id
                })
                    .exec(function (error, messagePersonal) {
                        if (error) {
                            io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 500, message: 'Error in transaction' })
                            res.sendStatus(500);
                        }
                        else if (!messagePersonal) {
                            io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 404, message: 'Messages not found' })
                            res.sendStatus(404);
                        }
                        io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 200, message: 'Success', messagePersonalRoom: messagePersonalRoom, messagePersonal: messagePersonal })
                        res.sendStatus(200);
                    });
            }
            else {
                io.sockets.in(req.query.room_socket_io).emit('get-personal-messages', { status: 200, message: 'Success', messagePersonalRoom: messagePersonalRoom, messagePersonal: [] })
                res.sendStatus(200);
            }
        });
});


app.get('/api/message-personal-service/get-messages-by-room', (req, res) => {
    //Find rooms
    MessagePersonalRoom.find({
        $or: [
            { user_one: req.query.id_one },
            { user_two: req.query.id_one }
        ]
    })
        .populate('user_one')
        .populate('user_two')
        .sort({
            _id: 'desc'
        })
        .exec(function (err, messagePersonalRoom) {
            if (err) {
                io.emit('get-messages-by-room', { status: 500, message: 'Error in transaction' })
                res.sendStatus(500);
            }
            else if (!messagePersonalRoom) {
                io.emit('get-messages-by-room', { status: 404, message: 'Messages not found' })
                res.sendStatus(404);
            }
            if (messagePersonalRoom.length) {
                //If exist last messages
                var idMessagesPersonalRoom = [];
                messagePersonalRoom.forEach(function (element) {
                    idMessagesPersonalRoom.push(element._id);
                });

                //Find messages
                MessagePersonal.find({
                    message_personal_room: { $in: idMessagesPersonalRoom }
                },
                    {},
                    {
                        $group: { _id: "$message_personal_room" }
                    })
                    .sort({
                        _id: 'desc',
                        created_date: 'desc'
                    })
                    .exec(function (error, messagePersonal) {
                        if (error) {
                            io.emit('get-messages-by-room', { status: 500, message: 'Error in transaction' })
                            res.sendStatus(500);
                        }
                        else if (!messagePersonal) {
                            return res.json({ status: 404, message: "Users not found" });
                        }
                        var curentId;
                        var messagePM = [];
                        for (let index = 0; index < messagePersonal.length; index++) {
                            if (index == 0) {
                                messagePM.push(messagePersonal[index]);
                                curentId = (messagePersonal[index].message_personal_room).toString();
                            }
                            else {
                                if (curentId !== (messagePersonal[index].message_personal_room).toString()) {
                                    messagePM.push(messagePersonal[index]);
                                }
                                curentId = (messagePersonal[index].message_personal_room).toString();
                            }
                        }
                        return res.json({ status: 0, messagePersonalRoom: messagePersonalRoom, messagePersonal: messagePM });
                    });
            }
            else {
                return res.json({ status: 0, messagePersonalRoom: messagePersonalRoom, messagePersonal: [] });
            }
        });
});

//Create connection
io.on('connection', function (socket) {
    socket.on('subscribe', function (room) {
        socket.join(room);
    });
});

mongoose.connect('mongodb://' + global.prodMongDb + '/' + global.mongoDb, { useNewUrlParser: true }, (err) => {
    if (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`App listening port ${port}`);
});