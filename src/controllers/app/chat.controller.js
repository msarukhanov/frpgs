const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const chatService = require('../../services/app/chat.service');

router.get('/', list);
router.post('/', add);
// router.put('/:id', edit);
// router.get('/:id', item);

function list(req, res, next) {
    const data = {...req.query};
    chatService.list(data)
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
    chatService.item(req.params.id)
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
    chatService.add(req.body)
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
    chatService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;