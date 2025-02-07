const request1 = require('request');
const util = require('util');
const request = util.promisify(request1);
const crypto = require('crypto');
const fs = require('fs');

const knex = require('../config/db.config');

module.exports = {
    init,
    hash,
    partnerRequest,
    partnerPlayerBalance
};

function hash(string) {
    return crypto.createHmac('sha256', string).update('BFA').digest('hex');
}

function init() {

    process.env.TZ = 'Asia/Manila';
    console.log(new Date());

    _log = console.log;
    _error = console.error;
    global.console.log = function (d) {
        const traceobj = new Error("").stack.split("\n")[2].split(":");
        const file = traceobj[0].split('mtw-eg-api/')[1];
        const line = traceobj[1];
        const new_args = [file + ":" + line + " >>"];
        new_args.push.apply(new_args, arguments);

        // if(!process.env.DEV && (process.ENV==='staging')) {
            const time = new Date();
            const date = time.getDate() + "-" + (time.getMonth() + 1) + "-" + time.getFullYear();
            const log_file = fs.createWriteStream(__dirname + '/../../logs/log-' + date + '.txt', {flags: 'a'});
            log_file.write(JSON.stringify({time, file, line, data: util.format(d)}) + '\n');
        // }

        _log.apply(null, new_args);
    };
    global.console.error = function (e, args) {
        const traceobj = new Error("").stack.split("\n")[2].split(":");
        const file = traceobj[0].split('mtw-eg-api/')[1];
        const line = traceobj[1];
        try {
            if (e) {
                if(!process.env.DEV) {
                    const error = {
                        file: file,// + ' >> ' + funcName,
                        line: Number(line),
                        error: arguments[0].toString(),
                        arguments: arguments[1] ? JSON.stringify(arguments[1]) : null,
                        created_at: new Date()
                    };
                    knex('platform_errors').insert(error).then();
                }
            }
        }
        catch (e) {
            // console.log(e);
        }
        const new_args = [file + ":" + line + " >>"];
        new_args.push.apply(new_args, arguments);

        const time = new Date();
        const date = time.getDate() + "-" + (time.getMonth()+1) + "-" + time.getFullYear();
        const log_file = fs.createWriteStream(__dirname + '/../../logs/error-' + date + '.txt', {flags : 'a'});
        log_file.write(JSON.stringify({time, file, line, data: util.format(e)}) + '\n');

        _error.apply(null, new_args);
    };
}

async function partnerRequest({body, partner_id}) {
    try {
        console.log(body);
        const partner = await knex('partners').select('casino_callback_url', 'sportsbook_key', 'sportsbook_secret')
            .where({id: partner_id});
        if (!partner || !partner[0]) {
            return {
                error: true,
                text: 'Invalid player info.'
            }
        }
        const {casino_callback_url, sportsbook_key, sportsbook_secret} = partner[0];
        if (!casino_callback_url || !sportsbook_key || !sportsbook_secret) {
            return {
                error: true,
                text: 'Invalid player info.'
            }
        }
        const partnerToken = crypto.createHmac("SHA256", sportsbook_secret).update(JSON.stringify(body)).digest('hex').toString();

        let req = await request({
            method: "POST",
            uri : casino_callback_url,
            headers: {
                'partnerKey' : sportsbook_key,
                'partnerToken' : partnerToken
            },
            json: true,
            body,
            timeout: 9900000
        });
        const res = req.toJSON().body;
        // const error = {
        //     file: 'casino-tunnel',
        //     line: 223,
        //     arguments: JSON.stringify(body),
        //     error: JSON.stringify(res),
        //     created_at: new Date()
        // };
        // knex('platform_errors').insert(error).then();
        // console.log(res);
        if(!res.player_name) {
            return {
                err: true
            }
        }
        return res;
    }
    catch(e) {
        console.log(e);
        return {
            error: true
        }
    }
}

async function partnerPlayerBalance({partner, player_id}) {
    try {
        let casino_callback_url;
        switch (partner.type) {
            case 'durja-app':
                casino_callback_url = 'https://induswin.com/iGaming/casino'; //'https://api-test.superclub.tk/iGaming/casino';
                let req = await request({
                    method: "POST",
                    uri : casino_callback_url,
                    headers: {
                        // 'partnerKey' : sportsbook_key,
                        // 'partnerToken' : partnerToken
                    },
                    json: true,
                    body: {
                        action: 'balance',
                        player_id
                    },
                    timeout: 1500
                });
                const body = req.toJSON().body;
                console.log(body);
                body.player_name = player_id;
                if(!body || !body.currency || !body.player_name) {
                    return {
                        err: true
                    }
                }
                let player = await knex('players').select('id').where({'username': body.player_name});
                console.log(player);
                if(!player || !player[0]) {
                    const query = await create({
                        username : body.player_name,
                        balance : body.balance,
                        currency: body.currency,
                        partner_id: 1
                    });
                    if(query.err) {
                        return {
                            err: true
                        }
                    }
                    else {
                        return query;
                    }
                }
                else {
                    console.log(body, player);
                    const currency = await knex('constants_currencies').select('id').where({'constants_currencies.name': body['currency']});
                    if(!currency || !currency[0]) {
                        return {
                            err: true
                        }
                    }
                    console.log(currency);
                    const query = await knex('players_balances')
                        .where({'currency_id': currency[0]['id'], 'player_id': player[0]['id']})
                        .update({'amount':  Number(body['balance'])}, ['id']);
                    console.log(query);
                    if(!query || !query[0]) {
                        return {
                            err: true
                        }
                    }
                    return {
                        id: player[0]['id'],
                        balance: Number(body['balance'])
                    };
                }
                return {
                    err: true
                };
                break;
        }

    }
    catch(e) {
        console.log(e);
        return {
            error: true
        }
    }
}

async function create(item) {
    if (!item.username) {
        return {
            err: true,
            type: "db",
            msg: "Missing fields"
        };
    }
    item.status = 'integration';

    const trx = await knex.transaction();

    try {
        let currency;
        if (item.currency) {
            currency = await trx.select("id").from(('constants_currencies')).where({name: item.currency});
        }
        let maxId = await knex('players').max('id');
        maxId = maxId[0]['max'];

        let query = trx.insert({
            id: maxId + 1,
            username: item.username,
            currency_id: currency ? currency[0]['id'] : 1,
            token: item.token,
            created_at: new Date(),
            updated_at: new Date(),
            partner_id: item.partner_id || 1,
            status: item.status,
            isService: true,
            lang: 'en',
            website_id: 0
        }, ['id']).into(('players'));

        const create = await query;
        if (create[0] && create[0]['id']) {
            const balance = await trx.insert({
                player_id: create[0]['id'],
                amount: Number(item.balance),
                currency_id: currency[0]['id'],
                created_at: new Date(),
                updated_at: new Date()
            }, ['id']).into('players_balances');
            if (!balance[0] || !balance[0]['id']) {
                trx.rollback();
                return {
                    err: true,
                    type: "db",
                    msg: "b1"
                };
            }
            item['id'] = create[0]['id'];
            trx.commit();
            return item;
        }
    }
    catch (e) {
        console.error(e, arguments);
        trx.rollback();
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