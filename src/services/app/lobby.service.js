const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const {sendMessageAll, deleteForAll} = require('../../modules/socket');

const table = 'games_lobby';

module.exports = {
    list,
    item,
    add,
    del,
    current,
    join,
    start
};

async function list({limit = 20, page = 0, id, player}) {
    try {
        const query = knex(table).leftOuterJoin('users', table+'.owner', '=', 'users.id');
        query.select(
            table+'.id',
            table+'.name',
            'users.name as host',
            table+'.type',
            table+'.lobby',
            table+'.maxPlayers',
            table+'.created_at'
        );
        query.where({
            'games_lobby.game':id,
            'games_lobby.season': null,
            'games_lobby.status': 0
        }).groupBy('games_lobby.id').groupBy('users.id');
        query.limit(limit || 20).offset(page ? (page * limit) : 0);
        query.orderBy('games_lobby.created_at','desc');
        const items = await query;
        if (items) {
            if(items.length) {
                for(let i in items) {
                    try {
                        items[i]['lobby'] = JSON.parse(items[i]['lobby']).length;
                    }
                    catch (e) {
                        items[i]['lobby'] = 0;
                    }
                }
            }
            return items;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function item({limit = 20, page = 0, id, id2, player}) {
    try {
        let lobbyIDs;
        const lobbyQuery = await knex('games_lobby').select('lobby').where({
            id: id2,
            game: id,
        });
        if(!lobbyQuery || !lobbyQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
        try {
            lobbyIDs = JSON.parse(lobbyQuery[0].lobby || []);
        }
        catch(e) {
            return {
                err: true,
                type: "lobby players error"
            };
        }
        const query = knex('users');
        query.select('name');
        query.whereIn('id', lobbyIDs);
        query.limit(limit || 20).offset(page ? (page * limit) : 0);
        query.orderBy('name');
        const items = await query;
        if (items) {
            return items;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function current({limit = 20, page = 0, id, id2, player}) {
    try {
        const query = knex('games_lobby')
            .leftOuterJoin('users', table+'.owner', '=', 'users.id')
            .select(
                'games_lobby.id',
                'games_lobby.name',
                'games_lobby.lobby',
                'games_lobby.type',
                'games_lobby.maxPlayers',
                'users.name as host',
            )
            .where(q => q.where('games_lobby.lobby', 'ilike', '%'+player+'%').andWhere({'games_lobby.game':id, 'games_lobby.status':0}))
            .orWhere({'games_lobby.game':id, 'games_lobby.status':0, 'games_lobby.owner': player})
            .groupBy('games_lobby.id').groupBy('users.id');

        const items = await query;
        if (items) {
            if(items.length) {
                for(let i in items) {
                    try {
                        items[i]['lobby'] = JSON.parse(items[i]['lobby']).length;
                    }
                    catch (e) {
                        items[i]['lobby'] = 0;
                    }
                }
            }
            return items[0] || null;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function add({id, name, game, maxPlayers, player}) {
    try {
        let lobby = {
            name,
            game,
            type: null,
            owner: player,
            maxPlayers,
            lobby: '[]',
            status: 0,
            created_at: new Date()
        };
        let query = knex('games_lobby').insert(lobby, ['id']);
        const item = await query;
        if (item && item[0] || item[0]['id']) {
            const msg = {
                id: Number(item[0]['id']),
                name,
                type: null,
                host: player,
                maxPlayers,
                lobby: 0,
                players: [],
                created_at: new Date()
            };
            sendMessageAll('game', {
                type:'game-list-add',
                data: msg
            }, id);
            return msg;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.log(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function join({limit = 20, page = 0, id, id2, player}) {
    try {
        let lobbyIDs;
        const lobbyQuery = await knex('games_lobby').select('lobby','maxPlayers').where({
            id: id2,
            game: id,
            status: 0
        });
        if(!lobbyQuery || !lobbyQuery[0]) {
            return {
                err: true,
                type: "invalid lobby data"
            };
        }
        try {
            lobbyIDs = JSON.parse(lobbyQuery[0].lobby || []);
        }
        catch(e) {
            return {
                err: true,
                type: "lobby players error"
            };
        }
        let index = lobbyIDs.findIndex(i=>i===player);
        if(index > -1) {
            lobbyIDs.splice(index,1);
        }
        else {
            if(Number(lobbyQuery[0].maxPlayers) === lobbyIDs.length) {
                return {
                    err: true,
                    type: "lobby full"
                };
            }
            lobbyIDs.push(player);
        }
        const updQuery = await knex('games_lobby').where({
            id: id2,
            game: id,
            status: 0
        }).update({lobby: JSON.stringify(lobbyIDs)}, ['id']);
        if(!updQuery || !updQuery[0]) {
            return {
                err: true,
                type: "error updating lobby"
            };
        }

        const query = knex('users');
        query.select('name');
        query.whereIn('id', lobbyIDs);
        query.limit(limit || 20).offset(page ? (page * limit) : 0);
        query.orderBy('name');
        const items = await query;
        if (items) {
            sendMessageAll('game', {
                type:'game-list-upd',
                data: {id:Number(id2),lobby:lobbyIDs.length}
            }, id);
            sendMessageAll('lobby', {
                type:'lobby-update',
                data: {
                    players: items,
                }
            }, id2);
            return items;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function start({id, name, id2, player}) {
    try {
        let lobbyIDs;
        const lobbyQuery = await knex('games_lobby').select('lobby','owner','name').where({
            id: id2,
            game: id,
            owner: player,
            status: 0
        });
        if(!lobbyQuery || !lobbyQuery[0]) {
            return {
                err: true,
                type: "invalid lobby data or player is not owner"
            };
        }
        try {
            lobbyIDs = JSON.parse(lobbyQuery[0].lobby || []);
        }
        catch(e) {
            return {
                err: true,
                type: "lobby players error"
            };
        }

        let season = {
            name: lobbyQuery[0].name,
            master: player,
            game: id,
            created_at: new Date(),
            status: 'active',
            lobby: lobbyQuery[0].lobby
        };
        let seasonQuery = await knex('seasons').insert(season, ['id']);
        if(!seasonQuery || !seasonQuery[0]) {
            return {
                err: true,
                type: "error adding season"
            };
        }
        season.id = seasonQuery[0]['id'];
        let playerSeasons = [], playersSaves = [];
        lobbyIDs.forEach((pId)=>{
            playerSeasons.push({
                player: pId,
                season: season.id,
                created_at: season.created_at
            });
            playersSaves.push({
                game: id,
                player: pId,
                season: season.id,
                turn: 0,
                type: 'auto',
                turn_player: lobbyIDs[0],
                turn_lobby: lobbyQuery[0].lobby,
                created_at: season.created_at
            })
        });
        playersSaves.push({
            game: id,
            player: player,
            season: season.id,
            turn: 0,
            type: 'master',
            turn_player: lobbyIDs[0],
            turn_lobby: lobbyQuery[0].lobby,
            data: '{}',
            created_at: season.created_at
        });
        let playerSeasonsQuery = await knex('player_seasons').insert(playerSeasons, ['id']);
        if(!lobbyQuery || !lobbyQuery[0] || (playerSeasonsQuery.length !== playerSeasons.length)) {
            return {
                err: true,
                type: "error adding player seasons"
            };
        }
        let playersSavesQuery = await knex('player_saves').insert(playersSaves, ['id']);
        if(!playersSavesQuery || !playersSavesQuery[0] || (playersSavesQuery.length !== playersSaves.length)) {
            return {
                err: true,
                type: "error adding temp saves"
            };
        }

        const query = knex('games_lobby').where({id:id2}).update({status:1, started_at: season.created_at}, ['id']);
        const item = await query;
        if (item && item.length) {
            sendMessageAll('game', {
                type:'game-list-del',
                data: {id:Number(id2)}
            }, id);
            sendMessageAll('lobby', {
                type:'lobby-start',
                data: {}
            }, id2);
            deleteForAll('lobby', Number(id2));
            return item;
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function del({id, id2, player}) {
    try {
        const lobbyQuery = await knex('games_lobby').select('lobby').where({
            id: id2,
            game: id,
            owner: player,
            status: 0
        });
        if(!lobbyQuery || !lobbyQuery[0]) {
            return {
                err: true,
                type: "invalid lobby data or player is not owner"
            };
        }
        const query = await knex('games_lobby').where({
            id: id2,
            game: id,
            status: 0
        }).del(['id']);
        if(query && query[0]) {
            sendMessageAll('game', {
                type:'game-list-del',
                data: {id:Number(id2)}
            }, id);
            deleteForAll('lobby', Number(id2));
            // sendMessageAll('lobby', {
            //     type:'lobby-delete',
            //     data: {
            //         id: Number(id2),
            //     }
            // }, id2);
            return query;
        }
        return {
            err: true,
            type: "error deleting lobby"
        };
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}