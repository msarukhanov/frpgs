const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');
const authorizeNS = require('../../middlewares/authNotStrict');
const gamePurchased = require('../../middlewares/gamePurchased');

const helpers = require('../../helpers/global');
const gamesService = require('../../services/app/games.service');

router.route('/session/:id/:season').post(authorize, gamePurchased, sessionAdd);
router.route('/session/:id/:season').delete(authorize, gamePurchased, sessionEnd);
router.route('/').get(authorizeNS, list);
router.post('/', add);
router.route('/rate').post(authorize, rate);
router.put('/:id', edit);
router.route('/:id').get(authorizeNS, item);

function list(req, res, next) {
    if(!req.query.type) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.query, player : req.player};
    gamesService.list(data)
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
    const data = {...req.params, player : req.player};
    gamesService.item(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function add(req, res, next) {
    if(!req.body.name) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    gamesService.add(req.body)
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
    gamesService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function rate(req, res, next) {
    if(!req.body.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.body, player : req.player};
    gamesService.rate(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function sessionAdd(req, res, next) {
    if(!req.params.season) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    gamesService.sessionAdd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function sessionEnd(req, res, next) {
    if(!req.params.season) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    gamesService.sessionEnd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;