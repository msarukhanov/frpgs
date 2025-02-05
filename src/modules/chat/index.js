const WebSocketServer = require('ws');

const portWss = 443, portWs = 8080;

const channels = {
    chat : []
};

module.exports = {
    init
};

function init() {
    const wssServer = new WebSocketServer.Server({ port: portWss });
    const wsServer = new WebSocketServer.Server({ port: portWs });
    // wsServer.on('connection', handleWS);
    wssServer.on('connection', handleWS);
    // console.log('The WebSocket server wsServer is running on port ' + portWs);
    console.log('The WebSocket server wssServer is running on port ' + portWss);
}

function handleWS(ws) {
    ws.on('message', data => {
        try {
            data = JSON.parse(data);
            console.log(data);
            switch (data.type) {
                case 'chat-connect':
                    console.log('new client connected');
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    channels['chat'] = channels['chat'].filter((client) => (client.socketID === ws.socketID)||(client.socketName === ws.socketName));
                    channels['chat'].push(ws);
                    sendOnlineAll();
                    break;
                case 'online':
                    sendOnline(ws);
                    break;
                case 'chat':
                    channels[data.type].forEach((client) => {
                        sendMessage(client, data);
                    });
                    break;
            }
        } catch(e) {}
    });

    ws.on('close', () => {
        console.log('the client has disconnected');
        channels['chat'] = channels['chat'].filter((client) => client.socketID === ws.socketID);
        sendOnlineAll();
    });

    ws.onerror = function () {
        console.log('Some Error occurred')
    };
}

function sendOnlineAll() {
    channels['chat'].forEach((client) => sendOnline(client));
}

function sendOnline(client) {
    sendMessage(client, {type:'chat-online', data: {online: channels['chat'].length, users: channels['chat'].map(({socketName, socketID}) => (socketName || socketID))}});
}

function sendMessage(client, message) {
    client.send(JSON.stringify(message));
}