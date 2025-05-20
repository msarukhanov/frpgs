const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const transactionsService = require('./transactions.service');

module.exports = {
    getPricesPlayer,
};

async function getPricesPlayer() {
    try {
        const items = await knex('platform_settings')
            .select('value').whereIn('type', ['ai_token_cost_platform_usd','ai_image_cost_tokens']);
        if (!items || !items.length) {
            return {
                err: true,
                type: "db"
            };
        }
        return {
            token_cost : Number(items[0]['ai_token_cost_platform_usd']),
            image_cost_tokens : Number(items[0]['ai_image_cost_tokens'])
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

