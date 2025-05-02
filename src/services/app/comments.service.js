const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const table = '_comments';

module.exports = {
    list,
    add,
};

async function list({limit = 20, page = 0, player, type, data, token}) {
    try {
        let filter = {}, table;
        switch (type) {
            case 'games':
                const checkQuery = await knex('games').select('id').where({id:data});
                if(!checkQuery || !checkQuery[0]) {
                    return {
                        err: true,
                        type: "db"
                    };
                }
                filter['games_comments.game'] = data;
                table = 'games_comments';
                break;
            default:
                return {
                    err: true,
                    type: "invalid type"
                };
                break;
        }
        const query = knex(table).select(table+'.text',table+'.created_at as date','users.name as player')
            .leftOuterJoin('users', { 'users.id': table+'.player'})
            .where(filter);
        query.limit(limit || 20).offset(page ? (page * limit) : 0);
        query.orderBy(table+'.created_at','desc');
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

async function add({player, type, data, text}) {
    try {
        let table, message;
        switch (type) {
            case 'games':
                table = 'games_comments';
                break;
            default:
                return {
                    err: true,
                    type: "invalid type"
                };
                break;
        }
        switch (type) {
            case 'games':
                message = {
                    game: data,
                    player,
                    text,
                    created_at: new Date()
                };
                break;
        }
        let query = knex(table).insert(message, ['id']);
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