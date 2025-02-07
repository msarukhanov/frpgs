const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

module.exports = {
    list,
    item,
    add,
    edit
};

async function list({limit = 20, page = 0, player, season}) {
    try {
        // const query = knex('characters').select('id', 'name', 'image', 'slug');
        const query = knex('characters').select('*');
        if(player) {
            query.where({player})
        }
        if(season) {
            query.where({season})
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

async function item({slug}) {
    try {
        const query = knex('characters').select('*').where({slug});
        const items = await query;
        if (items && items.length) {
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

async function add({name, text, date}) {
    try {
        let query = knex('characters').insert({
            name,
            text,
            date
        }, ['id']);
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

async function edit({id, code, name, campaign, start, status}) {
    try {
        let query = knex('characters').where({id}).update({
            code,
            name,
            campaign,
            start,
            status
        }, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                if(status === 'active') {
                    query = await knex('characters').update({status:'inactive'}).whereNot({id:item[0]['id']})
                }
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





// const query = knex('characters')
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