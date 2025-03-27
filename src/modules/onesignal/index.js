const app_id = '79d5a58f-a83f-437e-a536-5cdb7328e2c4';
const restApiKey = 'os_v2_app_phk2ld5ih5bx5jjwltnxgkhcyrl2u6ueiybuf2nlousayfzoj7tuy2lhn2jsosy5vwzgsou3x5xfjuzzw5zyybpus5pu3grympxpbxq';

// const fetch = require('fetch');

const headers = {
    accept: 'application/json',
    Authorization: 'Key ' + restApiKey,
    'content-type': 'application/json'
};


async function listNotification() {
    const url = 'https://api.onesignal.com/notifications?app_id=' + app_id;
        //'&limit=limit&offset=offset&kind=kind&template_id=template_id&time_offset=time_offset';
    const options = {
        method: 'GET',
        headers
    };
    fetch(url, options)
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.error(err));
}

async function createNotification() {
    const url = 'https://api.onesignal.com/notifications?c=push';
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({
            app_id,
            name: 'FRPG',
            // custom_data: {link:'/video'},

            include_aliases: {"onesignal_id": ['4701a90d-f6f0-47dc-b010-9a784eb891a9']},
            "target_channel": "push",

            data: { targetUrl: 'frpg.https://frpg.netlify.app/video',},
            headings: {en:'Video'},
            contents: {en: 'You have new video call.'},
            // included_segments: ['All']
        })
    };
    fetch(url, options)
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.error(err));
}


// const request = require('request');
// const options = {
//     url: 'https://api.github.com/repos/request/request',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Authorization': 'Key '+restApiKey
//     }
// };
//
//
// async function createNotification() {
//
//     request({...options, body:{
//         "app_id": app_id,
//         "contents": {
//             "en": "Your message body here."
//         },
//         "included_segments": [
//             "Subscribed Users"
//         ]
//     }}, (resp)=>{
//         console.log(resp);
//     })
// }


module.exports = {
    listNotification,
    createNotification
};