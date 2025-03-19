const WebSocketServer = require('ws');
const knex = require('../../config/db.config');

const { ExpressPeerServer, PeerServer } = require("peer");

const portWss = 443;

const channels = {
    chat : [],
    video: []
};

module.exports = {
    init,
    initVideoCalls
};

function init(server) {
    const wssServer = new WebSocketServer.Server({ server });
    wssServer.on('connection', handleWS);
    console.log('The WebSocket server wssServer is running on port ' + portWss);
    // app.use("/peerjs", peerServer);
}

function initVideoCalls(server, app) {
    const peerServer = ExpressPeerServer(server);
    console.log(peerServer);
    peerServer.on('open', () => {
        console.log("Server: Peer open.");
    });
    peerServer.on('error', (error) => {
        console.log("Server: Peer error.", error);
    });
    peerServer.on('connection', (client) => {
        console.log("Server: Peer connected with ID:", client.id);
        channels.video.push(client.id);
    });
    peerServer.on('disconnect', (client) => {
        console.log("Server: Peer disconnected with ID:", client.id);
        channels.video.splice(channels.video.indexOf(i=>i===client.id),1);
    });
    app.use("/peerjs", peerServer);
    // const peerServer = PeerServer({ port: 80, path: '/' });
    // console.log("Peer server initializing.");
    // peerServer.on('open', () => {
    //     console.log("Server: Peer open.");
    // });
    // peerServer.on('error', (error) => {
    //     console.log("Server: Peer error.", error);
    // });
    // peerServer.on('connection', (client) => {
    //     console.log("Server: Peer connected with ID:", client.id);
    //     channels.video.push(client.id);
    // });
    // peerServer.on('disconnect', (client) => {
    //     console.log("Server: Peer disconnected with ID:", client.id);
    //     channels.video.splice(channels.video.indexOf(i=>i===client.id),1);
    // });


}

function handleWS(ws) {
    ws.on('message', data => {
        try {
            data = JSON.parse(data);
            // console.log(64, data);
            switch (data.type) {
                case 'chat-connect':
                    console.log('new client connected', data);
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    channels['chat'] = channels['chat'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['chat'].push(ws);
                    sendOnlineAll();
                    break;
                case 'chat-disconnect':
                    console.log('client disconnected', data);
                    channels['chat'] = channels['chat'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll();
                    break;
                case 'onesignal':
                    console.log(data);
                    if(data.name && data.oneSignalId) {
                        knex('users').where({name:data.name}).update({oneSignalId:data.oneSignalId}, ['id']).then((res)=>{console.log(res)});
                    }
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
        channels['chat'] = channels['chat'].filter((client) => client.socketID !== ws.socketID);
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
    sendMessage(client, {
        type:'chat-online',
        data: {online: channels['chat'].length,
        users: channels['chat'].map(({socketName, socketID}) => {return {name:socketName,id:socketID}})}
    });
}

function sendMessage(client, message) {
    client.send(JSON.stringify(message));
}