const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');
const authorizeNS = require('../../middlewares/authNotStrict');
const gamePurchased = require('../../middlewares/gamePurchased');
const gameOwner = require('../../middlewares/gameOwner');

const helpers = require('../../helpers/global');
const gamesService = require('../../services/app/games.service');

router.route('/session/:id/edit').post(authorize, gameOwner, sessionEditAdd);
router.route('/session/:id/edit').delete(authorize, gameOwner, sessionEditEnd);
router.route('/session/:id/:season').post(authorize, gamePurchased, sessionPlayAdd);
router.route('/session/:id/:season').delete(authorize, gamePurchased, sessionPlayEnd);
router.route('/').get(authorizeNS, list);
router.route('/').post(authorize, add);
// router.post('/', add);
router.route('/rate').post(authorize, rate);
router.route('/:id').put(authorize, gameOwner, edit);
// router.put('/:id', edit);
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
    const data = {...req.params, player : req.player};
    gamesService.add(data)
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
    const data = {...req.body, player : req.player};
    gamesService.edit(data)
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

function sessionEditAdd(req, res, next) {
    const data = {...req.params, player : req.player};
    gamesService.sessionEditAdd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function sessionEditEnd(req, res, next) {
    const data = {...req.params, player : req.player};
    gamesService.sessionEditEnd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function sessionPlayAdd(req, res, next) {
    if(!req.params.season) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    gamesService.sessionPlayAdd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function sessionPlayEnd(req, res, next) {
    if(!req.params.season) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    gamesService.sessionPlayEnd(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;