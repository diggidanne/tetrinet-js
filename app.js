var fs = require('fs');
var pf = require('./playfield');
var g = require('./game.js');
var names = require('./names.js');

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
io.set('log level', 1)
app.listen(process.env.PORT || 8080);

static_url_map = {
    '/': ['index.html','text/html'],
    '/static/js/drawing.js': ['/static/js/drawing.js', 'application/javascript'],
    '/static/js/nodemock.js': ['/static/js/nodemock.js', 'application/javascript'],
    '/static/js/shapes.js': ['/shapes.js', 'application/javascript'],
    '/static/js/playfield.js': ['/playfield.js', 'application/javascript'],
}

function serve_static(res, url) {
    if(url in static_url_map) {
        var match = static_url_map[url];
        path = match[0];
        content_type = match[1];
        fs.readFile(__dirname + "/" + path,
            function (err, data) {
                if(err) {
                    res.writeHead(500);
                    console.log(err);
                    return res.end("Error loading static file" + path);
                }
                res.writeHead(200, {'Content-Type': content_type});
                res.end(data);
            }
        );
    }
}

function handler(req, res) {
    serve_static(res, req.url);
}


io.sockets.on('connection', function (socket) {
    socket.name = names.shuffle_name();
    console.log('registered player ' + socket.name);
    socket.emit('registered', socket.name);
    g.GameMgr.find_or_create_game(socket);

    var game = g.GameMgr.game_for(socket);
    socket.on('message', function (data) {
        switch(data) {
            case 'left':
                game.move_left(socket);
                break;
            case 'right':
                game.move_right(socket);
                break;
            case 'rotate':
                game.rotate(socket);
                break;
            case 'down':
                game.move_down(socket);
                break;
            case 'start_game':
                game.start_game(socket);
                break;
            case 'free_fall':
                game.free_fall(socket);
                break;
        }
    });

    socket.on('disconnect', function (data) {
        console.log('disconnect');
        game.remove_player(socket);
    });
});

