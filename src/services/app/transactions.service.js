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
        let transaction_type, transaction_item, commission_type, commission_percent, temp1, temp2;

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
                commission_percent = await knex('platform_settings')
                    .select('value').where({type:commission_type});
                if(!commission_percent || !commission_percent[0]) {
                    return {
                        err: true,
                        type: "db",
                        description: 'platformSettings'
                    };
                }
                commission_percent = Number(commission_percent[0]['value']);
                // commission_percent = commission_game_purchase;
                transaction_type = 'game_purchase';
                transaction_item = await knex('games')
                    .leftOuterJoin('users_wallets', function () {
                        this.on('users_wallets.player', '=', 'games.owner')
                            .andOnVal('users_wallets.type', '=', 'dev');
                    })
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
            case 'ai-tokens':
                if(!target || (target<0)) {
                    return {
                        err: true,
                        type: "db",
                        description: 'invalid value'
                    };
                }
                target = Number(target);
                transaction_item = {};
                transaction_item['cost'] = await knex('platform_settings')
                    .select('value').where({type:'ai_token_cost_platform_usd'});
                if(!transaction_item['cost'] || !transaction_item['cost'][0]) {
                    return {
                        err: true,
                        type: "db",
                        description: 'platformSettings'
                    };
                }
                transaction_item['cost'] = Number(transaction_item['cost'][0]['value']);

                transaction_item['player_tokens'] = await knex('player_tokens')
                    .select('value').where({player, type});
                if(!transaction_item['player_tokens']) {
                    return {
                        err: true,
                        type: "db",
                        description: 'platformSettings'
                    };
                }
                transaction_item['player_tokens'] = transaction_item['player_tokens'][0] || null;
                transaction_item['price'] = Number(transaction_item['cost'] * Number(target));
                break;

            case 'pass':
                transaction_item['price'] = await knex('platform_passes')
                    .select('price').where({type:target});
                if(!transaction_item['price'] || !transaction_item['price'][0]) {
                    return {
                        err: true,
                        type: "db",
                        description: 'invalid pass params'
                    };
                }
                transaction_item['price'] = transaction_item['price'][0]['price'];
                break;

            case 'service':
                transaction_item['price'] = await knex('platform_services')
                    .select('price').where({type:target});
                if(!transaction_item['price'] || !transaction_item['price'][0]) {
                    return {
                        err: true,
                        type: "db",
                        description: 'invalid service params'
                    };
                }
                transaction_item['price'] = transaction_item['price'][0]['price'];
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

        try {
            const result = await knex.transaction(async (trx) => {
                const now = new Date(), oneMonthLater = new Date();
                let amount_dev, amount_platform, transaction_dev, transaction_platform;
                let new_balance_player, new_balance_dev, new_balance_platform;
                switch (type) {
                    case 'game':
                        amount_dev = Number((transaction_item.price*(100-commission_percent)/100).toFixed(2));
                        amount_platform = Number((transaction_item.price*(commission_percent)/100).toFixed(2));
                        transaction_dev = {
                            id: uuidv4(),
                            player,
                            type: transaction_type,
                            amount: amount_dev,
                            from_wallet: playerWallet.id,
                            to_wallet: transaction_item.to_wallet_id,
                            target,
                            created_at: now
                        };
                        transaction_platform = {
                            id: uuidv4(),
                            player,
                            type: commission_type,
                            amount: amount_platform,
                            from_wallet: playerWallet.id,
                            to_wallet: platformWallet.id,
                            target,
                            created_at: now
                        };
                        new_balance_player = playerWallet.balance - transaction_item.price;
                        new_balance_dev = transaction_item.to_wallet_balance + amount_dev;
                        new_balance_platform = transaction_item.to_wallet_balance + amount_platform;

                        const addGame = await trx('player_games').insert({player, game:target, created_at: now }, ['id']);
                        if (addGame.length !== 1) {
                            throw new Error('Не удалось добавить игру.');
                        }
                        break;
                    case 'ai-tokens':
                        amount_platform = Number((transaction_item.price).toFixed(2));
                        transaction_platform = {
                            id: uuidv4(),
                            player,
                            type: 'ai_tokens_purchase',
                            amount: amount_platform,
                            from_wallet: playerWallet.id,
                            to_wallet: platformWallet.id,
                            target,
                            created_at: now
                        };
                        new_balance_player = playerWallet.balance - transaction_item.price;
                        new_balance_platform = transaction_item.to_wallet_balance + amount_platform;

                        if(transaction_item['player_tokens']) {
                            const updAiTokens = await trx('player_tokens').where({player, type})
                                .update({value: (target+Number(transaction_item['player_tokens']['value'])), updated_at: now }, ['id']);
                            if (updAiTokens.length !== 1) {
                                throw new Error('Не удалось добавить игру.');
                            }
                        }
                        else {
                            const addAiTokens = await trx('player_tokens')
                                .insert({player, type, value: target, created_at: now }, ['id']);
                            if (addAiTokens.length !== 1) {
                                throw new Error('Не удалось добавить игру.');
                            }
                        }
                        break;
                    case 'pass':
                        amount_platform = Number((transaction_item.price).toFixed(2));
                        transaction_platform = {
                            id: uuidv4(),
                            player,
                            type: 'pass_purchase',
                            amount: amount_platform,
                            from_wallet: playerWallet.id,
                            to_wallet: platformWallet.id,
                            target,
                            created_at: now
                        };
                        new_balance_player = playerWallet.balance - transaction_item.price;
                        new_balance_platform = transaction_item.to_wallet_balance + amount_platform;

                        const existingPassSubscription = await trx('player_subscriptions')
                            .where('player', player)
                            .andWhere('type', 'pass')
                            .andWhere('target', target)
                            .andWhere('status', 1)
                            .andWhere('end_at', '>', now)
                            .first();
                        if (existingPassSubscription) {
                            oneMonthLater.setMonth(new Date(existingPassSubscription.end_at).getMonth() + 1);
                            const updPassSubscription = await trx('player_subscriptions')
                                .where('id', existingPassSubscription.id)
                                .update({
                                    end_at: oneMonthLater,
                                    updated_at: now
                                }, ['id']);
                            if (updPassSubscription.length !== 1) {
                                throw new Error('Не удалось обновить сервис.');
                            }
                        } else {
                            oneMonthLater.setMonth(now.getMonth() + 1);
                            const addPassSubscription = await trx('player_subscriptions').insert({
                                player,
                                type: 'pass',
                                target,
                                status: 1,
                                created_at: now,
                                start_at: now,
                                end_at: oneMonthLater
                            }, ['id']);
                            if (addPassSubscription.length !== 1) {
                                throw new Error('Не удалось добавить сервис.');
                            }
                        }
                        break;
                    case 'service':
                        amount_platform = Number((transaction_item.price).toFixed(2));
                        transaction_platform = {
                            id: uuidv4(),
                            player,
                            type: 'service_purchase',
                            amount: amount_platform,
                            from_wallet: playerWallet.id,
                            to_wallet: platformWallet.id,
                            target,
                            created_at: now
                        };
                        new_balance_player = playerWallet.balance - transaction_item.price;
                        new_balance_platform = transaction_item.to_wallet_balance + amount_platform;

                        const existingServiceSubscription = await trx('player_subscriptions')
                            .where('player', player)
                            .andWhere('type', 'service')
                            .andWhere('target', target)
                            .andWhere('status', 1)
                            .andWhere('end_at', '>', now)
                            .first();
                        if (existingServiceSubscription) {
                            oneMonthLater.setMonth(new Date(existingServiceSubscription.end_at).getMonth() + 1);
                            const updServiceSubscription = await trx('player_subscriptions')
                                .where('id', existingServiceSubscription.id)
                                .update({
                                    end_at: oneMonthLater,
                                    updated_at: now
                                }, ['id']);
                            if (updServiceSubscription.length !== 1) {
                                throw new Error('Не удалось обновить сервис.');
                            }
                        } else {
                            oneMonthLater.setMonth(now.getMonth() + 1);
                            const addServiceSubscription = await trx('player_subscriptions').insert({
                                player,
                                type: 'service',
                                target,
                                status: 1,
                                created_at: now,
                                start_at: now,
                                end_at: oneMonthLater
                            }, ['id']);
                            if (addServiceSubscription.length !== 1) {
                                throw new Error('Не удалось добавить сервис.');
                            }
                        }
                        //
                        // const addService = await trx('player_subscriptions').insert({
                        //     player,
                        //     type: 'service',
                        //     target,
                        //     created_at: now,
                        //     start_at: now,
                        //     end_at: now
                        // }, ['id']);
                        // if (addService.length !== 1) {
                        //     throw new Error('Не удалось добавить сервис.');
                        // }
                        break;
                    default:
                        return {
                            err: true,
                            type: "db"
                        };
                        break;
                }
                if(transaction_dev) {
                    const addTransactionsDev = await trx('player_transactions').insert(transaction_dev, ['id']);
                    if (addTransactionsDev.length !== 1) {
                        throw new Error('Не удалось добавить dev транзакции.');
                    }
                }
                if(transaction_platform) {
                    const addTransactionsPlatform = await trx('player_transactions').insert(transaction_platform, ['id']);
                    if (addTransactionsPlatform.length !== 1) {
                        throw new Error('Не удалось добавить platform транзакции.');
                    }
                }

                const updBalancePlayer = await trx('users_wallets').where({id: playerWallet.id})
                    .update({ balance: new_balance_player, updated_at: now }, ['id']);
                if (updBalancePlayer.length === 0) {
                    throw new Error('Не удалось обновить баланс игрока.');
                }

                if(transaction_dev) {
                    const updBalanceDev = await trx('users_wallets').where({id: transaction_item.to_wallet_id})
                        .update({ balance: new_balance_dev, updated_at: now }, ['id']);
                    if (updBalanceDev.length === 0) {
                        throw new Error('Не удалось обновить баланс разработчика.');
                    }
                }

                if(transaction_platform) {
                    const updBalancePlatform = await trx('users_wallets').where({id: platformWallet.id})
                        .update({ balance: new_balance_platform, updated_at: now }, ['id']);
                    if (updBalancePlatform.length === 0) {
                        throw new Error('Не удалось обновить баланс платформы.');
                    }
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