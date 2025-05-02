const cron = require('node-cron');
const knex = require('../config/db.config');

module.exports = {
    init
};

function init() {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const deleted = await knex('games_lobby')
                .whereNull('started_at')
                .andWhere('created_at', '<', knex.raw("NOW() - INTERVAL '1 hour'"))
                .del();
            console.log(`Удалено устаревших лобби: ${deleted}`);
        } catch (error) {
            console.error('Ошибка при удалении старых лобби:', error);
        }
    });
}