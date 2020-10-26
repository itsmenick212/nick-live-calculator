var path = require('path');
var express = require('express');
var calc = express();
var webpack = require('webpack');
var config = require('./webpack.config');
var server =require('http').createServer(calc);
var io = require('socket.io')(server);
var compiler = webpack(config);
var port = process.env.port || 8080;

calc.use(express.static(path.join(__dirname, '/')));

calc.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
}));

calc.use(require('webpack-hot-middleware')(compiler));


calc.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

var onlineUsers = {};
var onlineCount = 0;

io.on('connection', function(socket) {

    socket.on('login', function(obj){

        socket.id = obj.uid;

        // add the new user to the list, onlineCount++
        if (!onlineUsers.hasOwnProperty(obj.uid)) {
            onlineUsers[obj.uid] = obj.username;
            onlineCount++;
        }

        io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        console.log(obj.username+'connect to the Calculator');
    })

    socket.on('disconnect', function() {
        if(onlineUsers.hasOwnProperty(socket.id)) {
            var obj = {uid:socket.id, username:onlineUsers[socket.id]};
            delete onlineUsers[socket.id];
            onlineCount--;

            // send 'logout'event, update data
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
            console.log(obj.username+'disconnect to the Calculator');
        }
    })

    socket.on('message', function(obj){
        io.emit('message', obj);
        console.log(obj.username+" Calculated "+ obj.message)
    })

});

server.listen(port, function(err) {
    console.log('This server is running on port *:8080');
});
