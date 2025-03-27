const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('/edit/:type', saveEdit);
router.get('/', getView);
router.post('/', saveView);
// router.get('/edit/', getEdit);


function getView(req, res, next) {
    try {
        fs.readFile(__dirname + '/../../static/data.json', 'utf-8', function (err, data) {
            if (err) res.json({err: true});
            res.json(JSON.parse(data));
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

function saveView(req, res, next) {
    try {
        const split =  __dirname.split('/');
        split.splice(split.length-5,5);
        const path = split.join('/')+'/fantasy-rpg/fantasy-rpg/src/app/static/data.json';
        fs.writeFile(path, JSON.stringify(req.body), 'utf-8', function (err) {
            if (err) res.json({err: true, type: 'json'});
            res.json(1);
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

// function getEdit(req, res, next) {
//     try {
//         fs.readFile(__dirname + '/../../static/map.json', 'utf-8', function (err, data) {
//             if (err) res.json({err: true});
//             res.json(JSON.parse(data));
//         });
//     }
//     catch (e) {
//         res.json(JSON.parse({err: true}))
//     }
// }
//
function saveEdit(req, res, next) {
    try {
        const split =  __dirname.split('/');
        split.splice(split.length-5,5);
        const path = split.join('/')+'/fantasy-rpg/fantasy-rpg/src/app/static/generated/';

        fs.writeFile(path + req.params.type+'/'+req.body.slug+'.ts', 'export const '+req.body.slug +' = '+JSON.stringify(req.body) + ';', 'utf-8', function (err) {
            if (err) res.json({err: true});
            fs.readFile(path + req.params.type+'/'+'_generated.ts', 'utf-8', function (err, generated) {
                if (err) res.json({err: true});
                let constName = '';
                switch (req.params.type) {
                    case 'characters':
                        constName = 'generatedCharacters';
                        break;
                }
                generated = generated.replace('import {'+req.body.slug+'} from "./'+req.body.slug+'";\n','');
                generated = generated.replace(req.body.slug+',','');
                generated = 'import {'+req.body.slug+'} from "./'+req.body.slug+'";\n'+generated;
                generated = generated.replace(constName+' = {',constName+' = {'+req.body.slug+',');
                fs.writeFile(path + req.params.type+'/'+'_generated.ts', generated, 'utf-8', function (err, data) {
                    if (err) res.json({err: true});
                    res.json(1);
                });
            });
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

module.exports = router;