const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const helpers = require('../../helpers/global');
const lobbyService = require('../../services/app/lobby.service');


// router.get('/', list);
router.post('/', add);
// router.post('/rate', rate);
// router.put('/:id', edit);
router.post('/:id/start/:id2', start);
router.post('/:id', add);
router.delete('/:id/:id2', del);
router.put('/:id/:id2', join);
router.get('/:id/current', current);
router.get('/:id/:id2', item);
router.get('/:id', list);

function list(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function item(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id || !req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.item(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function current(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.current(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function join(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id || !req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.join(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function start(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id || !req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.start(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function add(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    if(!req.body.name) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, ...req.body, token : req.headers.authorization};
    lobbyService.add(data)
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
    lobbyService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function del(req, res, next) {
    if(!req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Auth required."
        });
        return;
    }
    if(!req.params.id || !req.params.id2) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, token : req.headers.authorization};
    lobbyService.del(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;