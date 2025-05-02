const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const table = '_comments';

module.exports = {
    list,
    add,
};

async function list({limit = 20, page = 0, player, type, data, token}) {
    try {
        const items =[];
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

async function add({player, type, target}) {
    try {
        let transaction_type, transaction_item, commission_type, commission_percent;

        let platformSettings = await knex('platform_settings')
            .select('*').where({});
        if(!platformSettings || !platformSettings[0]) {
            return {
                err: true,
                type: "db",
                description: 'platformSettings'
            };
        }
        platformSettings = platformSettings[0];

        let platformWallet = await knex('users_wallets').select('id','balance').where({type:'platform'});
        if(!platformWallet || !platformWallet[0]) {
            return {
                err: true,
                type: "db",
                description: 'invalid platform data'
            };
        }
        platformWallet = platformWallet[0];

        let playerWallet = await knex('users_wallets').select('id','balance').where({player,type:'player'});
        if(!playerWallet || !playerWallet[0]) {
            return {
                err: true,
                type: "db",
                description: 'invalid player data'
            };
        }
        playerWallet = playerWallet[0];

        switch (type) {
            case 'game':
                commission_type = 'commission_game_purchase';
                commission_percent = Number(platformSettings[commission_type]);
                transaction_type = 'game_purchase';
                transaction_item = await knex('games')
                    .leftOuterJoin('users_wallets', function () {
                        this.on('users_wallets.player', '=', 'games.owner')
                            .andOnVal('users_wallets.type', '=', 'dev');
                    })
                    // .leftOuterJoin('users_wallets', {'users_wallets.player':'games.owner','users_wallets.type':'"dev"'})
                    .select('games.id','games.owner','games.price','users_wallets.id as to_wallet_id', 'users_wallets.balance as to_wallet_balance')
                    .where({'games.id':target});
                if(!transaction_item || !transaction_item[0]) {
                    return {
                        err: true,
                        type: "db",
                        description: 'invalid game/transaction data'
                    };
                }
                transaction_item = transaction_item[0];
                break;
            default:
                return {
                    err: true,
                    type: "db"
                };
                break;
        }

        if(playerWallet.balance < transaction_item.price) {
            return {
                err: true,
                type: "balance",
                description: 'not enough balance'
            };
        }
        
        const amount_dev = Number((transaction_item.price*(100-commission_percent)/100).toFixed(2)), 
            amount_platform = Number((transaction_item.price*(commission_percent)/100).toFixed(2));
        const now = new Date();
        const transaction_dev = {
            id: uuidv4(),
            player,
            type: transaction_type,
            amount: amount_dev,
            from_wallet: playerWallet.id,
            to_wallet: transaction_item.to_wallet_id,
            target,
            created_at: now
        };
        const transaction_platform = {
            id: uuidv4(),
            player,
            type: commission_type,
            amount: amount_platform,
            from_wallet: playerWallet.id,
            to_wallet: platformWallet.id,
            target,
            created_at: now
        };
        const new_balance_player = playerWallet.balance - transaction_item.price;
        const new_balance_dev = transaction_item.to_wallet_balance + amount_dev;
        const new_balance_platform = transaction_item.to_wallet_balance + amount_platform;

        try {
            const result = await knex.transaction(async (trx) => {
                switch (type) {
                    case 'game':
                        const addGame = await trx('player_games').insert({player, game:target, created_at: now }, ['id']);
                        if (addGame.length !== 1) {
                            throw new Error('Не удалось добавить игру.');
                        }
                        break;
                    default:
                        return {
                            err: true,
                            type: "db"
                        };
                        break;
                }
                const addTransactions = await trx('player_transactions').insert([transaction_dev, transaction_platform], ['id']);
                if (addTransactions.length !== 2) {
                    throw new Error('Не удалось добавить все транзакции.');
                }
                const updBalancePlayer = await trx('users_wallets').where({id: playerWallet.id})
                    .update({ balance: new_balance_player, updated_at: now }, ['id']);
                if (updBalancePlayer.length === 0) {
                    throw new Error('Не удалось обновить баланс игрока.');
                }
                const updBalanceDev = await trx('users_wallets').where({id: transaction_item.to_wallet_id})
                    .update({ balance: new_balance_dev, updated_at: now }, ['id']);
                if (updBalanceDev.length === 0) {
                    throw new Error('Не удалось обновить баланс разработчика.');
                }
                const updBalancePlatform = await trx('users_wallets').where({id: platformWallet.id})
                    .update({ balance: new_balance_platform, updated_at: now }, ['id']);
                if (updBalancePlatform.length === 0) {
                    throw new Error('Не удалось обновить баланс платформы.');
                }
                return {
                    err: false
                };
            });
            if(result && !result.err) {
                return result;
            }
        } catch (err) {
            console.error('Произошёл откат транзакции:', err.message);
            return {
                err: true,
                type: 'transaction',
                description: err.message
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