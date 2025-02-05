const WebSocketServer = require('ws');
const portWss = 443, portWs = 8080;
const wssServer = new WebSocketServer.Server({ portWss });
const wsServer = new WebSocketServer.Server({ portWs });

const channels = {
    chat : []
};

wsServer.on('connection', ws => {

    console.log('new client connected WS');

    channels['chat'].push(ws);
    ws.send('joined');

    ws.on('message', data => {
        console.log(`Client has sent us: ${data}`);
        ws.send(data);
    });

    ws.on('close', () => {
        console.log('the client has disconnected');
        channels['chat'] = channels['chat'].filter((client) => client !== ws);
    });

    ws.onerror = function () {
        console.log('Some Error occurred')
    };
});

wssServer.on('connection', ws => {

    console.log('new client connected WSS');

    channels['chat'].push(ws);
    ws.send('joined');

    ws.on('message', data => {
        console.log(`Client has sent us: ${data}`);
        ws.send(data);
    });

    ws.on('close', () => {
        console.log('the client has disconnected');
        channels['chat'] = channels['chat'].filter((client) => client !== ws);
    });

    ws.onerror = function () {
        console.log('Some Error occurred')
    };
});

console.log('The WebSocket server wsServer is running on port '+wsServer);

console.log('The WebSocket server wssServer is running on port '+wssServer);