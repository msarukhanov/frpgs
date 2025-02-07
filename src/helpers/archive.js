// knex.raw('SELECT * FROM pg_tables WHERE schemaname=\'public\'').then((res) => {
//     if (res.rowCount) {
//         console.log(res.rows[0]);
//         let rows = res.rows.map(i=>i.tablename);
//         console.log(rows)
//     }
// });
// knex.raw('SELECT pg_catalog.setval(pg_get_serial_sequence(\'players_bonuses\', \'id\'), MAX(id)) FROM players_bonuses;').then((res) => {
//     console.log(res);
//     if (res.rowCount) {
//         // console.log(res.rows[0]);
//         // let rows = res.rows.map(i=>i.tablename);
//         // console.log(rows)
//     }
// });

// knex('partners_websites')
//     .select(
//         'cashback_settings',
//     )
//     .where({partner_id: 1, id: 1, cashback_enabled: true}).then(r=>{
//         console.log(r);
// });

// // const lsports = require('./src/integrations/lsports/lsports');
// // lsports.proceedPreMatchSnapshot().then();
//
// const sports = require('./src/services/sports/sports.service');
// sports.data({type: "sport-grouped"}).then(r0 => {
//     console.log(JSON.stringify(r0));
// });
// sports.data({type: "events", tournamentName: 'Euro 2020'}).then(r0 => {
//     console.log(r0);
// });
// sports.data({type: "event", eventId: '7167393'}).then(r0 => {
//     console.log(r0);
// });

// sports.getList().then((r1)=>{
//     console.log(r1);
//     sports.getCountries({sportName: 'Football',}).then((r2)=>{
//         console.log(r2);
//         sports.getTournaments({sportName: 'Football',country: 'International'}).then((r3)=>{
//             console.log(r3);
//             sports.getEvents({sportName: 'Football',country: 'International', tournamentName: 'Euro 2020'}).then((r4)=>{
//                 console.log(r4);
//                 sports.getMarkets({eventId: '7167393'}).then((r5)=>{
//                     console.log(r5);
//                     sports.getOutcomes({eventId: '7167393', marketId: '1'}).then((r6)=>{
//                         console.log(r6);
//                     });
//                 });
//             });
//         });
//     });
// });

// const bonus = require('./src/services/shared/bonus.service');
// bonus.referralHistory({player_id: 2}).then(r=>{
//     console.log(r);
//     bonus.cashbackHistory({player_id: 2}).then(r=>{
//         console.log(r);
//         bonus.bonusHistory({player_id: 2}).then(r=>{
//             console.log(r);
//         });
//     });
// });
// bonus.checkReferrer({
//     amount: 100,
//     website_id: 1,
//     partner_id: 1,
//     player_id: 51,
//     currency_id: 1
// }).then((r) => {
//     console.log(r);
// });
// bonus.checkCashBack(
//     {
//         "player_id": "2",
//         "round_id": "64a2c106110c58000174a17c",
//         "partner_id": 1,
//         "balance": 1090.9917999999961,
//         "bet": 2,
//         "win": 0,
//         "currency_id": 1,
//         "game_id": 1184
//     }
// ).then((r) => {
//     console.log(r);
// });

// const levels = [10,8,6,4];
// async function getLevels(levels, player_id, data = []) {
//     let ref = await knex('players').select('referrer').where({id:player_id});
//     if(ref && ref[0] && ref[0]['referrer']) {
//         data.push(ref[0]['referrer']);
//         return await getLevels(levels, ref[0]['referrer'], data);
//     }
//     else return data;
// }
//
// getLevels(levels, 51, [51]).then(r=>{
//     console.log(r);
// });
// bonus.activateReloadBonus({partner_id:1, player_id:2, template_id:5, bonus_id:20, website_id:0}).then((r)=>{
//     console.log(r);
// });
// bonus.checkCashBack({game_id: 15956, partner_id: 1, bet:2, win:1}).then(()=>{
//
// });

// const crypto = require('crypto');
//
// function hash(string) {
//     return crypto.createHmac('sha256', string).update('BFA').digest('hex');
// }
// console.log(hash('Test123'));
// console.log('pQGrvZ59y2S7', hash("pQGrvZ59y2S7"));
// console.log('4lXS8o45GdFF', hash("4lXS8o45GdFF"));

const slot = require('../integrations/slotegrator');
// slot.getGameProviders({update: false}).then((res)=>{
//     // console.log(res);
// });

//6d6c53d44e42fd30783cd8601d3560c3a4497a3c

// slot.getGameList({update: true}).then((res)=>{
//     // console.log(res);
// });
// //
// slot.validate().then((res)=>{
//     // console.log(res);
// });

// slot.validateRequest({
//     "X-Merchant-Id": "b503e24b139521861d78ab5ad9a46c1a",
//     "X-Timestamp": "1688116770",
//     "X-Nonce": "6cda28b8661d4bc388dea65723fae8fc",
//     "X-Sign": "ec189708ea81993974ca602abf08ed4a9469c93f"
// }, {
//     "action": "win",
//     "amount": "406.9676",
//     "currency": "EUR",
//     "game_uuid": "2a581e6c012f57d49402d593b3c1adcf868cb204",
//     "player_id": "2",
//     "transaction_id": "aaafe7b1fb504e46aa52db3c4b1fe92b",
//     "session_id": "3ac39588c265e1ffdd93aa16d410d694e9c5c2ace8655963fc71d4fc3db3e68b",
//     "type": "win",
//     "round_id": "721311122"
// }).then((res)=>{
//     console.log(res);
// });

// slot.balance({player_id:'02d514d3c6d241bda6ce517e28ff682b'}).then((res)=>{
//     console.log(res);
// });


// const gamification = require('./src/services/shared/gamification.service');
// // gamification.addReport({player_id: 2, type: 'casinoBet', amount: 1000}).then((res)=>{console.log(res)});
// gamification.action({player_id: 2}).then((res)=>{console.log(res)})


// knex('casino_games').select(knex.raw('distinct casino_games."category"')).where({source_id:3}).then((r)=>{
//     const categories = r.map(i=>i.category);
//     console.log(categories.length);
// });
