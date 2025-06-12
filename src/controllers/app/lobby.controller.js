const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');
const gamePurchased = require('../../middlewares/gamePurchased');

const helpers = require('../../helpers/global');
const lobbyService = require('../../services/app/lobby.service');

router.route('/:id/start/:id2').post(authorize, gamePurchased, start);
router.route('/:id').post(authorize, gamePurchased, add);
router.route('/:id/:id2').delete(authorize, gamePurchased, del);
router.route('/:id/:id2').put(authorize, gamePurchased, join);

router.route('/:id/current').get(authorize, gamePurchased, current);
router.route('/:id/:id2').get(authorize, gamePurchased, item);
router.route('/:id').get(authorize, gamePurchased, list);

function list(req, res, next) {
    const data = {...req.params, player : req.player};
    lobbyService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function item(req, res, next) {
    if(!req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    lobbyService.item(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function current(req, res, next) {
    const data = {...req.params, player : req.player};
    lobbyService.current(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function join(req, res, next) {
    if(!req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player, data: req.body};
    lobbyService.join(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function start(req, res, next) {
    if(!req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    lobbyService.start(data)
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
    const data = {...req.params, ...req.body, player : req.player};
    lobbyService.add(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function del(req, res, next) {
    if(!req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, player : req.player};
    lobbyService.del(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;