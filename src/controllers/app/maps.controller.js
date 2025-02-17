const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/', getView);
router.post('/', saveView);
router.get('/edit/', getEdit);
router.post('/edit/', saveEdit);

function getView(req, res, next) {
    try {
        fs.readFile(__dirname + '/../../static/maps/world.json', 'utf-8', function (err, data) {
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
        fs.writeFile(__dirname + '/../../static/maps/world.json', JSON.stringify(req.body), 'utf-8', function (err) {
            if (err) res.json({err: true});
            res.json(1);
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

function getEdit(req, res, next) {
    try {
        fs.readFile(__dirname + '/../../static/map.json', 'utf-8', function (err, data) {
            if (err) res.json({err: true});
            res.json(JSON.parse(data));
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

function saveEdit(req, res, next) {
    try {
        fs.writeFile(__dirname + '/../../static/map.json', JSON.stringify(req.body), 'utf-8', function (err) {
            if (err) res.json({err: true});
            res.json(1);
        });
    }
    catch (e) {
        res.json(JSON.parse({err: true}))
    }
}

module.exports = router;