const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const All = require('../../static/All.json');


module.exports = {
    list,
    info,
    addAll,
    add,
    edit
};

async function list({}) {
    try {
        const query = knex('religions').select('id', 'slug', 'name', 'image', 'character', 'description', 'created_at');
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
        const query = knex('religions').select('id', 'slug', 'name', 'image', 'character', 'description', 'created_at').where({id});
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

async function add({slug, name, image, character, description}) {
    try {
        let query = knex('religions').insert({
            slug,
            name,
            image,
            character,
            description
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

async function addAll({}) {
    try {
        let all = Object.values(All.Characters).map(i => {
            i.created_at = new Date();
            if (i.race) {
                i.race = i.race.slug;
            }
            if (i.nation) {
                i.nation = i.nation.slug;
            }
            if (i.name && i.name.length) {
                // i.name = JSON.stringify(i.name)
            }
            if (i.appearance && i.appearance.length) {
                // i.appearance = JSON.stringify(i.appearance)
            }
            if (i.titles && i.titles.length) {
                // i.titles = JSON.stringify(i.titles)
            }
            if (i.religions && i.religions.length) {
                i.religions = i.religions.map(i => {return {connection: i.connection, slug: i.slug}});
                // i.religions = JSON.stringify(i.religions)
            }
            if (i.factions && i.factions.length) {
                i.factions = i.factions.map(i => {return {connection: i.connection, slug: i.slug}});
                // i.factions = JSON.stringify(i.factions)
            }
            if (i.campaigns && i.campaigns.length) {
                i.campaigns = i.campaigns.map(i => {return {connection: i.connection, slug: i.slug}});
                // i.campaigns = JSON.stringify(i.campaigns)
            }
            if (i.dungeons && i.dungeons.length) {
                i.dungeons = i.dungeons.map(i => {return {connection: i.connection, slug: i.slug}});
                // i.dungeons = JSON.stringify(i.dungeons)
            }
            if (i._class) {
                i['classes']= [{circle: i.level, slug: i._class.slug}];
            }
            delete i._class;
            delete i.level;
            if (i.stats) {
                i.stats = JSON.stringify(i.stats)
            }
            if (i.other) {
                if(i.other.gifts) {
                    i.other.gifts = i.other.gifts.map(i => i.slug);
                }
                i.other = JSON.stringify(i.other)
            }
            if (i.connections) {
                // i.connections = JSON.stringify(i.connections)
            }
            return i;
        });
        let query = await knex('characters').insert(all, ['id']);
        if (query && query.length) {
            console.log(query);
            if (query[0] || query[0]['id']) {
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
// addAll({}).then();
async function edit({id, slug, name, image, character, description}) {
    try {
        let query = knex('religions').where({id}).update({
            slug,
            name,
            image,
            character,
            description
        }, ['id']);
        const item = await query;
        if (item && item.length) {
            if (item[0] || item[0]['id']) {
                return {
                    err: true,
                    type: "db"
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
//     if(i.religion && i.religion.length) {
//         i.religion = i.religion.map(i=>i.slug);
//         i.religion = JSON.stringify(i.religion)
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