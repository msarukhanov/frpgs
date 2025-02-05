const WebSocketServer = require('ws');
const port = 443;
const wss = new WebSocketServer.Server({ port });

const channels = {
    chat : []
};

wss.on('connection', ws => {

    console.log('new client connected');

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
console.log('The WebSocket server is running on port '+port);