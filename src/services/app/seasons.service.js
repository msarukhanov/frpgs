const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const All = require('../../static/All.json');


module.exports = {
    list,
    info,
    add,
    edit
};

async function list({status}) {
    try {
        const query = knex('seasons').select('id', 'code', 'name', 'campaign', 'start', 'status', 'created_at');
        if(status) {
            query.where({status});
        }
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

async function info({id}) {
    try {
        const query = knex('seasons').select('id', 'code', 'name', 'campaign', 'start', 'status', 'created_at').where({id});
        const item = await query;
        if (item && item.length) {
            return item[0];
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

async function add({code, name, campaign, start, status}) {
    try {
        let query = knex('seasons').insert({
            code,
            name,
            campaign,
            start,
            status,
        }, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                if(status === 'active') {
                    query = await knex('seasons').update({status:'inactive'}).whereNot({id:item[0]['id']})
                }
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
        let query = knex('seasons').where({id}).update({
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
                    query = await knex('seasons').update({status:'inactive'}).whereNot({id:item[0]['id']})
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