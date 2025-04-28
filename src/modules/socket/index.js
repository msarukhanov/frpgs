const WebSocketServer = require('ws');
const knex = require('../../config/db.config');

const portWss = 443;

const channels = {
    main: [],
    dice: [],
    chat : [],
    video: [],
    game: {}
};

module.exports = {
    init,
    sendMessageAll
};

function init(server) {
    const wssServer = new WebSocketServer.Server({ server });
    wssServer.on('connection', handleWS);
    console.log('The WebSocket server wssServer is running on port ' + portWss);
}

function handleWS(ws) {
    ws.on('message', data => {
        try {
            data = JSON.parse(data);
            // console.log(64, data);
            switch (data.type) {
                case 'connect':
                    console.log('new client connected main', data);
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    channels['main'] = channels['main'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['main'].push(ws);
                    break;
                case 'disconnect':
                    console.log('client disconnected main', data);
                    channels['main'] = channels['main'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    break;
                case 'onesignal':
                    console.log(data);
                    if(data.name && data.oneSignalId) {
                        knex('users').where({name:data.name}).update({oneSignalId:data.oneSignalId}, ['id']).then((res)=>{console.log(res)});
                    }
                    break;
                    
                case 'chat-connect':
                    console.log('new client connected chat', data);
                    channels['chat'] = channels['chat'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['chat'].push(ws);
                    sendOnlineAll('chat');
                    break;
                case 'chat-disconnect':
                    console.log('client disconnected chat', data);
                    channels['chat'] = channels['chat'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll('chat');
                    break;
                case 'chat-online':
                    sendOnline('chat', ws);
                    break;

                case 'game-connect':
                    console.log('new client connected game', data);
                    ws.seasonID = data.seasonID;
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    if(!channels['game'][data.seasonID]) {
                        channels['game'][data.seasonID] = [];
                    }
                    channels['game'][data.seasonID] = channels['game'][data.seasonID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['game'][data.seasonID].push(ws);
                    sendOnlineAll('game', data.seasonID);
                    break;
                case 'game-disconnect':
                    console.log('client disconnected game', data);
                    channels['game'][ws.seasonID] = channels['game'][ws.seasonID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll('game',ws.seasonID);
                    break;
                case 'game-online':
                    sendOnline('game', ws, data.seasonID);
                    break;
                    
                case 'video-connect':
                    console.log('new client connected video', data);
                    channels['video'] = channels['video'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['video'].push(ws);
                    sendOnlineAll('video');
                    break;
                case 'video-disconnect':
                    console.log('client disconnected video', data);
                    channels['video'] = channels['video'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll('video');
                    break;
                case 'video-online':
                    sendOnline('video', ws);
                    break;
                    
                case 'dice-connect':
                    console.log('new dicer connected', data);
                    channels['dice'] = channels['dice'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['dice'].push(ws);
                    break;
                case 'dice-disconnect':
                    console.log('dcer disconnected', data);
                    channels['dice'] = channels['dice'].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    break;
                    
                case 'chat':
                case 'game':
                case 'dice':
                    channels[data.type].forEach((client) => {
                        sendMessage(client, data);
                    });
                    break;
            }
        } catch(e) {}
    });

    ws.on('close', () => {
        console.log('the client has disconnected');
        Object.keys(channels).forEach((channel)=>{
            if(channels[channel].length) {
                channels[channel] = channels[channel].filter((client) => client.socketID !== ws.socketID);
                sendOnlineAll(channel);
            }
            else {
                for(let room in channels[channel]) {
                    if(channels[channel][room]) {
                        channels[channel][room] = channels[channel][room].filter((client) => client.socketID !== ws.socketID);
                        sendOnlineAll(channel, room);
                    }
                }
            }
        })
    });

    ws.onerror = function () {
        console.log('Some Error occurred')
    };
}

function sendMessageAll(type, message, type2=null) {
    console.log('send-message-all', type, type2, message);
    if(type2) {
        channels[type][type2].forEach((client) => sendMessage(client, message));
    }
    else {
        channels[type].forEach((client) => sendMessage(client, message));
    }

}

function sendOnlineAll(type, type2=null) {
    console.log('send-all', type, type2);
    if(type2) {
        channels[type][type2].forEach((client) => sendOnline(type, client, type2));
    }
    else {
        channels[type].forEach((client) => sendOnline(type, client));
    }
}

function sendOnline(type, client, type2=null) {
    console.log('send', type, type2);
    if(type2) {
        sendMessage(client, {
            type:type+'-online',
            data: {
                online: channels[type][type2].length,
                users: channels[type][type2].map(({socketName, socketID}) => {return {name:socketName,id:socketID}})
            }
        });
    }
    else {
        sendMessage(client, {
            type:type+'-online',
            data: {
                online: channels[type].length,
                users: channels[type].map(({socketName, socketID}) => {return {name:socketName,id:socketID}})
            }
        });
    }
}

function sendMessage(client, message) {
    client.send(JSON.stringify(message));
}