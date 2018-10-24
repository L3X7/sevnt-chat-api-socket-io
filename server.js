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

    //Create message
    socket.on('create-message-personal', function (req) {
        var messagePersonal = new MessagePersonal({
            message_personal_room: req.message_room,
            created_by: req.user_one,
            message: req.message,
            status: true
        });
        messagePersonal.save(function (err) {
            if (err) {
                io.sockets.in(req.message_room).emit('get-message-personal', { status: 500, message: 'Error in transaction' });
            }
            else {
                io.sockets.in(req.message_room).emit('get-message-personal', { status: 200, messagePersonal: messagePersonal, message: 'Success' });
            }
        })
    });

    socket.on('typing', function (req){
        io.sockets.in(req.message_room).emit('typing',{ id: req.id, message: req.user + ' esta escribiendo...'});
    })


});

mongoose.connect('mongodb://' + global.prodMongDb + '/' + global.mongoDb, { useNewUrlParser: true }, (err) => {
    if (err) {
        console.log(err);
    }
});

