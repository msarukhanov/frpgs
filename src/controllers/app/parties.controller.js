const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/', list);
router.post('/', save);

function list(req, res, next) {
    fs.readFile(__dirname + '/../../static/parties.json', 'utf-8', function(err, data){
        if (err) res.json({err:true});
        res.json(JSON.parse(data));
    });
}

function save(req, res, next) {
    fs.writeFile(__dirname + '/../../static/parties.json', JSON.stringify(req.body), 'utf-8', function (err) {
        if (err) res.json({err:true});
        res.json(1);
    });
}

module.exports = router;