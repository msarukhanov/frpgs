const WebSocketServer = require('ws');
const knex = require('../../config/db.config');

const portWss = 443;

const channels = {
    main: [],
    dice: [],
    chat : [],
    video: [],
    game: {},
    season: {},
    lobby: {},
};

module.exports = {
    init,
    sendMessageAll,
    deleteForAll
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
                    ws.gameID = data.gameID;
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    if(!channels['game'][data.gameID]) {
                        channels['game'][data.gameID] = [];
                    }
                    channels['game'][data.gameID] = channels['game'][data.gameID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['game'][data.gameID].push(ws);
                    sendOnlineAll('game', data.gameID);
                    break;
                case 'game-disconnect':
                    console.log('client disconnected game', data);
                    channels['game'][ws.gameID] = channels['game'][ws.gameID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll('game',ws.gameID);
                    break;
                case 'game-online':
                    sendOnline('game', ws, data.gameID);
                    break;

                case 'season-connect':
                    console.log('new client connected season', data);
                    ws.seasonID = data.seasonID;
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    if(!channels['season'][data.seasonID]) {
                        channels['season'][data.seasonID] = [];
                    }
                    channels['season'][data.seasonID] = channels['season'][data.seasonID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['season'][data.seasonID].push(ws);
                    sendOnlineAll('season', data.seasonID);
                    break;
                case 'season-disconnect':
                    console.log('client disconnected season', data);
                    channels['season'][ws.seasonID] = channels['season'][ws.seasonID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendOnlineAll('season',ws.seasonID);
                    break;
                case 'season-online':
                    sendOnline('season', ws, data.seasonID);
                    break;

                case 'lobby-connect':
                    console.log('new client connected lobby', data);
                    ws.lobbyID = data.lobbyID;
                    ws['socketID'] = data['socketID'];
                    ws['socketName'] = data['name'];
                    if(!channels['lobby'][data.lobbyID]) {
                        channels['lobby'][data.lobbyID] = [];
                    }
                    channels['lobby'][data.lobbyID] = channels['lobby'][data.lobbyID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    channels['lobby'][data.lobbyID].push(ws);
                    sendOnlineAll('lobby', data.lobbyID);
                    break;
                case 'lobby-disconnect':
                    console.log('client disconnected lobby', data);
                    channels['lobby'][ws.lobbyID] = channels['lobby'][ws.lobbyID].filter((client) => (client.socketID !== ws.socketID)||(client.socketName !== ws.socketName));
                    sendMessage(ws, {type:'lobby-disconnected'});
                    sendOnlineAll('lobby',ws.lobbyID);
                    break;
                case 'lobby-online':
                    sendOnline('lobby', ws, data.lobbyID);
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

function deleteForAll(type, type2=null) {
    console.log('delete-all', type, type2);
    if(type2) {
        channels[type][type2].forEach((client, k) => {
            sendMessage(client, {type:type+'-delete',data:{id:type2}});
            if(k===(channels[type][type2].length-1)) {
                delete channels[type][type2];
            }
        });
    }
    else {
        channels[type].forEach((client, k) => {
            sendMessage(client, {type:type+'-delete'});
            if(k===(channels[type].length-1)) {
                delete channels[type];
            }
        });
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