const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const {sendMessageAll} = require('../../modules/socket');

const table = 'player_saves';

module.exports = {
    list,
    item,
    add,
    edit
};

async function list({limit = 20, page = 0, save, type, game, season, character, token}) {
    try {
        // const query = knex(table).select('id', 'name', 'image', 'slug');
        let master;
        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const player = userQuery[0]['id'];

        const gameQuery = await knex('games').select('id').where({id:game}).orWhere({name:game});
        if(!gameQuery || !gameQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        game = gameQuery[0]['id'];

        const seasonQuery = await knex('seasons').select('id', 'type_players', 'lobby', 'master').where({id:season}).orWhere({name:season});
        if(!seasonQuery || !seasonQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        season = seasonQuery[0]['id'];

        if(seasonQuery[0]['type_players'] === 'multi') {
            master = seasonQuery[0]['master'];
            const lobby = JSON.parse(seasonQuery[0]['lobby']);
            if(!lobby.find(i=>i===player)) {
                return {
                    err: true,
                    type: "invalid player in the lobby"
                };
            }
            type = 'master';
            character = null;
            console.log('load master save', master, type, save);
        }
        else {
            const characterQuery = await knex('player_characters').select('id').where({id:character}).orWhere({name:character});
            if(!characterQuery || !characterQuery[0]) {
                return {
                    err: true,
                    type: "db"
                };
            }
            character = characterQuery[0]['id'];
        }


        const query = knex(table).select('*');
        query.where({player: (master||player)});
        if(save) {
            query.where({id:save})
        }
        if(game) {
            query.where({game})
        }
        if(season) {
            query.where({season})
        }
        if(character) {
            query.where({character})
        }
        if(type) {
            query.where({type})
        }
        query.limit(limit || 20).offset(page ? (page * limit) : 0);
        query.orderBy('created_at', 'desc');
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
        console.log(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function item({slug}) {
    try {
        const query = knex(table).select('*').where({slug});
        const items = await query;
        if (items && items.length) {
            for(let i of ['religions','dungeons','campaigns','factions','classes']) {
                try{items[0][i] = (items[0][i] ? [JSON.parse(items[0][i])] : null)} catch(e) {}
            }
            return items[0];
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

async function add({save, game, character, season, token, type, data, turn}) {
    try {
        const id = save;
        let checkPlayer, checkMaster, savePlayer, saveMaster, master, turn_lobby = null, turn_player = null;

        const userQuery = await knex('users').select('id').where({token});
        if(!userQuery || !userQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        let player = userQuery[0]['id'];

        const seasonQuery = await knex('seasons')
            .select('id', 'type_players', 'lobby', 'master')
            .where({id: season});
        if(!seasonQuery || !seasonQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        season = seasonQuery[0];
        const lobby = season.lobby;

        if(season.type_players === 'multi') {
            type = 'auto';
            master = season.master;

            const saveQuery = await knex('player_saves')
                .select('*')
                .where({
                    type: 'master',
                    player: master,
                    season: season.id,
                    game,
                });
            if(!saveQuery || !saveQuery[0]) {
                return {
                    err: true,
                    type: "db"
                };
            }
            const autoSave = saveQuery[0];
            turn_player = autoSave.turn_player;
            turn_lobby = autoSave.turn_lobby;

            if(lobby !== turn_lobby) {
                return {
                    err: true,
                    type: "invalid lobby data"
                };
            }
            turn_lobby = JSON.parse(turn_lobby);

            if(player !== turn_player) {
                return {
                    err: true,
                    type: "invalid player data"
                };
            }

            // check the end of the turn
            if(player === turn_lobby[turn_lobby.length - 1]) {
                turn_player = turn_lobby[0];
                turn = autoSave.turn+1;
            }
            else {
                turn_player = turn_lobby[turn_lobby.findIndex(i=>i===player)+1];
            }

            saveMaster = {
                game,
                character: null,
                season: season.id,
                player: master,
                type: 'master',
                data,
                turn,
                turn_player,
                turn_lobby: JSON.stringify(turn_lobby),
                created_at: new Date()
            };

            checkMaster = !!(await knex(table).where({player:master, season: season.id, character:null, type:'master'}).limit(1)).length;
        }
        else {
            master = player;
            turn_player = player;
        }

        savePlayer = {
            game,
            character,
            season: season.id,
            player,
            type,
            data: saveMaster ? null : data,
            turn,
            turn_player,
            turn_lobby: JSON.stringify(turn_lobby),
            created_at: new Date()
        };

        if(type === 'auto') {
            checkPlayer = !!(await knex(table).where({player, season: season.id, character, type}).limit(1)).length;
        }

        if(saveMaster) {
            if(!checkMaster) {
                let queryM = knex(table).insert(saveMaster, ['id']);
                const itemM = await queryM;
                if (itemM && itemM.length) {
                    console.log('new master save');
                }
                else {
                    return {
                        err: true,
                        type: "error new master save"
                    };
                }
            }
            else {
                let queryM = knex(table).update(saveMaster, ['id']).where(id?{id}:{game,character:null,type:'master',season: season.id,player:master});
                const itemM = await queryM;
                if (itemM && itemM.length) {
                    console.log('upd master save');
                }
                else {
                    return {
                        err: true,
                        type: "error upd master save"
                    };
                }
            }

            sendMessageAll('game', {
                type:'season-update',
                data: {
                    game,
                    season: season.id,
                    data,
                    turn,
                    turn_player,
                    turn_lobby: JSON.stringify(turn_lobby),
                }
            }, season.id);
        }

        if(!checkPlayer) {
            let query = knex(table).insert(savePlayer, ['id']);
            const item = await query;
            if (item && item.length) {
                if (item[0] || item[0]['id']) {
                    console.log('new player save');
                    //TODO add socket update for all players
                    return {
                        id: item[0]['id'],
                        turn,
                        time: savePlayer.created_at
                    };
                }
                return {
                    err: true,
                    type: "error new player save"
                };
            }
        }
        else {
            let query = knex(table).update(savePlayer, ['id']).where(id?{id}:{type,game,character,season: season.id,player});
            const item = await query;
            if (item && item.length) {
                if (item[0] || item[0]['id']) {
                    console.log('upd player save');
                    //TODO add socket update for all players
                    return {
                        id: item[0]['id'],
                        turn,
                        time: savePlayer.created_at
                    };
                }
                return {
                    err: true,
                    type: "error upd player save"
                };
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