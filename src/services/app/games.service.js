const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');
const fs = require('fs');

const table = 'games';

module.exports = {
    list,
    item,
    add,
    edit,
    rate,
    sessionEditAdd,
    sessionEditEnd,
    sessionPlayAdd,
    sessionPlayEnd
};

async function list({limit = 20, page = 0, player, type, token}) {
    try {
        const gamesQuery = await knex('player_games').select('game');
        if(player) {
            switch (gamesQuery) {
                case 'my':
                    gamesQuery.where({owner: player});
                    break;
                case 'lib':
                    gamesQuery.where({player});
                    break;
                case 'all':
                    gamesQuery.where({player});
                    break;
            }
        }
        if(!gamesQuery || !gamesQuery[0]) {
            return [];
        }
        const games = gamesQuery.map(i=>i.game);
        const query = knex(table).select('id','image','name','price');
        if(games) {
            switch (type) {
                case 'my':
                    query.whereIn('id', games);
                    break;
                case 'lib':
                    query.whereIn('id', games);
                    break;
                case 'all':
                    query.whereNotIn('id', games);
                    break;
            }
        }
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
        console.log(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function item({id, player}) {
    try {
        const query = knex(table)
            .join('games_rating', 'games_rating.game', '=', 'games.id')
            .where({'games.id':id})
            .groupBy('games.id');
        if(player) {
            query.leftOuterJoin('player_games', { 'player_games.game': 'games.id', 'player_games.player':player});
            query.leftOuterJoin('games_sessions', { 'games_sessions.game': 'games.id', 'games_sessions.player':player});
            query.select(
                'games.*',
                'player_games.created_at as purchased',
                knex.raw('AVG(games_rating.rating) as rating'),
                knex.raw('SUM(games_sessions.duration) as duration')
            ).groupBy('player_games.id')
        }
        else {
            query.select(
                'games.*',
                knex.raw('AVG(games_rating.rating) as rating')
            )
        }
        const items = await query;
        if (items && items.length) {
            if(items[0]['owner']===player) {
                const query2 = knex(table).where({'games.id':id});
                query2.leftOuterJoin('games_rating', 'games_rating.game', '=', 'games.id');
                query2.leftOuterJoin('games_sessions', {'games_sessions.game': 'games.id'});
                query2.leftOuterJoin('games_comments', {'games_comments.game': 'games.id'});
                query2.select(
                    knex.raw('COUNT(DISTINCT games_sessions.player) as players_count'),
                    knex.raw('COUNT(DISTINCT games_rating.id) as rating_count'),
                    knex.raw('COUNT(DISTINCT games_comments.id) as comments_count'),
                    knex.raw('SUM(games_sessions.duration) as duration_total')
                ).groupBy('games.id');
                const items2 = await query2;
                if(items2.length) {
                    items[0] = {...items[0],...items2[0]}
                }
            }
            items[0]['purchased'] = !!items[0]['purchased'];
            items[0]['owner'] = player ? (items[0]['owner']===player) : false;
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

async function add({name, genres, image, description, price, type, player, id}) {
    try {
        if(genres) {genres = JSON.stringify(genres)}
        const id = uuidv4();
        const game = {
            id,
            name,
            genres,
            image,
            description,
            price,
            type,
            owner: player,
            created_at: new Date()
        };
        let query = knex(table).insert(game, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                const dir = __dirname + '/../../../games/';
                let directory = dir+id;
                if(!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }
                fs.cpSync(dir+'default', directory, { recursive: true });
                return game;
            }
            return {
                err: true,
                type: "db"
            };
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

async function edit({id, name, genres, image, description, price, type, player}) {
    try {
        if(genres) {genres = JSON.stringify(genres)}
        const game = {
            name,
            genres,
            image,
            description,
            price,
            type,
            owner: player,
            created_at: new Date()
        };
        let query = knex(table).where({id}).update(game, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                return 1;
            }
            return {
                err: true,
                type: "db"
            };
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

// async function edit({id, season, religions, campaigns, factions, classes}) {
//     id = 61;
//     try {
//         let query = knex(table).where({id}).update({
//             season, religions, campaigns, factions, classes
//         }, ['id']);
//         const item = await query;
//         if (item && item.length) {
//             if (item[0] || item[0]['id']) {
//                 // if(status === 'active') {
//                 //     query = await knex(table).update({status:'inactive'}).whereNot({id:item[0]['id']})
//                 // }
//                 return 1;
//             }
//         }
//         return {
//             err: true,
//             type: "db"
//         };
//     }
//     catch (e) {
//         console.log(e);
//         return {
//             err: true,
//             type: "db"
//         };
//     }
// }

async function rate({id, player, rating}) {
    try {
        const gamesQuery = await knex('games').select('id').where({id});
        if(!gamesQuery || !gamesQuery[0]) {
            return {
                err: true,
                type: "db"
            };
        }
        const game = gamesQuery[0]['id'];
        const ratingQuery = await knex('games_rating').select('id').where({game, player});
        if(!ratingQuery) {
            return {
                err: true,
                type: "db"
            };
        }
        if(!ratingQuery[0]) {
            let query = knex('games_rating').insert({
                player,
                game,
                rating,
                created_at: new Date()
            }, ['id']);
            const item = await query;
            if (item && item.length) {
                const query2 = knex(table)
                    .select(knex.raw('AVG(games_rating.rating) as rating'))
                    .join('games_rating', 'games_rating.game', '=', 'games.id')
                    .where({'games.id':id}).groupBy('games.id');
                const items = await query2;
                if (items && items.length) {
                    return items[0]['rating'];
                }
                return {
                    err: true,
                    type: "db"
                };
            }
            return {
                err: true,
                type: "db"
            };
        }
        else {
            let query = knex('games_rating').update({
                player,
                game,
                rating,
                created_at: new Date()
            }, ['id']).where({game, player, id:ratingQuery[0]['id']});
            const item = await query;
            if (item && item.length) {
                if (item[0] || item[0]['id']) {
                    const query2 = knex(table)
                        .select(knex.raw('AVG(games_rating.rating) as rating'))
                        .join('games_rating', 'games_rating.game', '=', 'games.id')
                        .where({'games.id':id}).groupBy('games.id');
                    const items = await query2;
                    if (items && items.length) {
                        return items[0]['rating'];
                    }
                    return {
                        err: true,
                        type: "db"
                    };
                }
                return {
                    err: true,
                    type: "db"
                };
            }
            return {
                err: true,
                type: "db"
            };
        }
    }
    catch (e) {
        console.log(e);
        return {
            err: true,
            type: "db"
        };
    }
}


async function sessionEditAdd({id, player}) {
    if(player === 1) {
        return {session: '1'};
    }
    try {
        const end = await sessionEditEnd({id, player});
        if(!end || end.err) {
            return {
                err: true,
                type: "db"
            };
        }
        let session = {
            session: uuidv4(),
            editor: player,
            duration: 0,
            game: id,
            created_at: new Date()
        };

        let query = await knex('editor_sessions').insert(session, ['id']);
        if (query && query[0] || query[0]['id']) {
            return {session: session.session};
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

async function sessionEditEnd({id, season, player}) {
    if(player === 1) {
        return 1;
    }
    try {
        const now = new Date();
        const query = await knex('editor_sessions')
            .where({
                editor: player,
                game: id,
                duration: 0
            })
            .update({
                ended_at: now,
                duration: knex.raw('EXTRACT(EPOCH FROM ? - created_at)', [now])
            }, ['id']);
        if(query) {
            return 1;
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

async function sessionPlayAdd({id, season, player}) {
    if(player === 1) {
        return {session: '1'};
    }
    try {
        const end = await sessionPlayEnd({id, season, player});
        if(!end || end.err) {
            return {
                err: true,
                type: "db"
            };
        }
        let session = {
            session: uuidv4(),
            player,
            duration: 0,
            game: id,
            // season,
            created_at: new Date()
        };

        let query = await knex('player_sessions').insert(session, ['id']);
        if (query && query[0] || query[0]['id']) {
            return {session: session.session};
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

async function sessionPlayEnd({id, season, player}) {
    if(player === 1) {
        return 1;
    }
    try {
        const now = new Date();
        const query = await knex('player_sessions')
            .where({
                player,
                game: id,
                duration: 0,
                season,
            })
            .update({
                ended_at: now,
                duration: knex.raw('EXTRACT(EPOCH FROM ? - created_at)', [now])
            }, ['id']);
        if(query) {
            return 1;
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