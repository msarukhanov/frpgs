const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const helpers = require('../../helpers/global');
const savesService = require('../../services/app/saves.service');

router.get('/', list);
router.post('/', add);
router.post('/auto', add);
router.put('/:id', edit);
router.get('/:id', item);

function list(req, res, next) {
    const data = {...req.query, token : req.headers.authorization};
    if(!data.token) {
        res.send({
            err: true,
            type: "params",
            description: "Auth error."
        });
        return;
    }
    savesService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function item(req, res, next) {
    if(!req.params.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    savesService.item(req.params.id)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function add(req, res, next) {
    const data = {...req.body,token : req.headers.authorization};
    if(!data.token) {
        res.send({
            err: true,
            type: "params",
            description: "Auth error."
        });
        return;
    }
    if(!data.character||!data.game||!data.season||!data.data) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    savesService.add(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function edit(req, res, next) {
    if(!req.body.name) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    savesService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;