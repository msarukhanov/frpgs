const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const {sendMessageAll, deleteForAll} = require('../../modules/socket');
const seasonsService = require('./seasons.service');

const table = 'games_lobby';

module.exports = {
    list,
    item,
    add,
    edit,
    del,
    current,
    join,
    start
};

async function list({limit = 20, page = 0, id, token}) {
    try {
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

async function item({limit = 20, page = 0, id, id2, token}) {
    try {
        let lobbyIDs;
        const userQuery = await knex('users').select('id', 'name').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

async function add({id, name, game, maxPlayers, token}) {
    try {
        const userQuery = await knex('users').select('id','name').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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
                host: userQuery[0]['id'],
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

async function edit({id, season, religions, campaigns, factions, classes}) {
    id = 61;
    try {
        let query = knex(table).where({id}).update({
            season, religions, campaigns, factions, classes
        }, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                // if(status === 'active') {
                //     query = await knex(table).update({status:'inactive'}).whereNot({id:item[0]['id']})
                // }
                return 1;
            }
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

async function join({limit = 20, page = 0, id, id2, token}) {
    try {
        let lobbyIDs;
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

async function start({id, name, id2, token}) {
    try {
        let lobbyIDs;
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

async function current({limit = 20, page = 0, id, id2, token}) {
    try {
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

async function del({id, id2, token}) {
    try {
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];
        const gamesQuery = await knex('player_games').select('game').where({game:id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "game not owned"
            };
        }
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

// edit({
//     religions: [{connections:"Адепт", slug:"godOfLight"}],
//     campaigns: [{connections:"Офицер", slug:"dreadKnightPersonal"}],
//     factions: [{connections:"Офицер", slug:"houseBlackwell"}],
//     classes: [{circle:"5", slug:"bloodMistSwordsman"}]
// }).then();

// let all = Object.values(All.Characters).map(i=>{
//     i.created_at = new Date();
//     // i.level = i.difficulty;
//     // delete i.difficulty;
//     // delete i.lead;
//     if(i.race) {
//         i.race = i.race.slug;
//     }
//     if(i.nation) {
//         i.nation = i.nation.slug;
//     }
//     if(i.name && i.name.length) {
//         i.name = JSON.stringify(i.name)
//     }
//     if(i.appearance && i.appearance.length) {
//         i.appearance = JSON.stringify(i.appearance)
//     }
//     if(i.titles && i.titles.length) {
//         i.titles = JSON.stringify(i.titles)
//     }
//     if(i.season && i.season.length) {
//         i.season = i.season.map(i=>i.slug);
//         i.season = JSON.stringify(i.season)
//     }
//     if(i.faction && i.faction.length) {
//         i.faction = i.faction.map(i=>i.slug);
//         i.faction = JSON.stringify(i.faction)
//     }
//     if(i.campaign && i.campaign.length) {
//         i.campaign = i.campaign.map(i=>i.slug);
//         i.campaign = JSON.stringify(i.campaign)
//     }
//     if(i.dungeon && i.dungeon.length) {
//         i.dungeon = i.dungeon.map(i=>i.slug);
//         i.dungeon = JSON.stringify(i.dungeon)
//     }
//     if(i._class) {
//         i._class = i._class.slug;
//     }
//     if(i._class) {i.stats = JSON.stringify(i.stats)}
//     if(i.other) {i.other = JSON.stringify(i.other)}
//     if(i.connections) {i.connections = JSON.stringify(i.connections)}
//     return i;
// });





// const query = knex(table)
//     // .join('races', 'races.slug', '=', 'characters.race')
//     .leftJoin(knex.raw(' "races" on "races"."slug" = characters.race'))
//     .leftJoin(knex.raw(' "nations" on "nations"."slug" = characters.nation'))
//     // .join('nations', 'nations.slug', '=', 'characters.nation')
//     .crossJoin(knex.raw(' "religions" on "religions"."slug" = any(characters.religions)'))
//     // .leftOuterJoin(knex.raw(' "factions" on "factions"."slug" = any(characters.factions)'))
//     // .join(knex.raw(' "campaigns" on "campaigns"."slug" = any(characters.campaigns)'))
//     // .join('religions', 'religions.slug', '=', 'any(characters.religion)')
//     // .join('classes', 'classes.slug', '=', 'characters._class')
//     .select(
//         knex.raw('characters.id, characters.name, characters.slug, characters.titles, ' +
//             'json_agg(row_to_json(races.*)) as races, ' +
//             'json_agg(row_to_json(nations.*)) as nations, ' +
//             'json_agg(row_to_json(religions.*)) as religions ' //+
//             // 'json_agg(factions) as factions '
//             //+
//             // 'json_agg(campaigns) as campaigns'
//             // +
//             // 'json_agg(classes) as _class,'
//         )
//         // 'characters.id',
//         // 'characters.name',
//         // 'characters.slug',
//         // knex.raw('select row_to_json((SELECT races.image, races.name, races.slug from races)) as race'),
//     ).where({'characters.slug': slug}).groupBy(['characters.id','races.id','nations.id','religions.id']);
//     const query = knex.raw('' +
//         'SELECT ch.id, ch.name, ch.slug, ch.titles, ' +
//         '_race as race, ' +
//         '_nation as nation, ' +
//         '_religions as religions, ' +
//         '_factions as factions, ' +
//         '_campaigns as campaigns ' +
//         'FROM   characters ch ' +
//
//         'CROSS  JOIN LATERAL ( ' +
//         'SELECT json_agg(r) AS _race ' +
//         'FROM   races r ' +
//         'WHERE slug = ch.race ' +
//         ') c1 ' +
//
//         'CROSS  JOIN LATERAL ( ' +
//         'SELECT json_agg(n) AS _nation ' +
//         'FROM   nations n ' +
//         'WHERE slug = ch.nation ' +
//         ') c2 ' +
//
//         'CROSS  JOIN LATERAL ( ' +
//         'SELECT json_agg(rel) AS _religions ' +
//         'FROM   religions rel ' +
//         'WHERE slug = any(ch.religions) ' +
//         ') c3 ' +
//
//         'CROSS  JOIN LATERAL ( ' +
//         'SELECT json_agg(f) AS _factions ' +
//         'FROM   factions f ' +
//         'WHERE slug = any(ch.factions) ' +
//         ') c4 ' +
//
//         'CROSS  JOIN LATERAL ( ' +
//         'SELECT json_agg(cam) AS _campaigns ' +
//         'FROM   campaigns cam ' +
//         'WHERE slug = any(ch.campaigns) ' +
//         ') c5 ' +
//         //
//         // 'CROSS  JOIN LATERAL ( ' +
//         // 'SELECT json_agg(rel) AS _religions ' +
//         // 'FROM   religions rel ' +
//         // 'WHERE slug = any(ch.religions) ' +
//         // ') c3 ' +
//
//         'WHERE  ch.slug = \''+slug+'\';');
// // .select(db.raw(`tA.id,tA.name,json_agg(tB) as tB`))
//     console.log(query.toSQL().toNative());
//     const item = await query;
//     if (item && item.rows && item.rows.length) {
//         return item.rows[0];
//     }
// item('quentinBlackwell').then(i=>{
//     console.log(i);
// });