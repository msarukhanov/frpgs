const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const helpers = require('../../helpers/global');
const seasonsService = require('../../services/app/seasons.service');

router.get('/', list);
router.post('/', add);
router.put('/:id', edit);
router.get('/:id', item);

function list(req, res, next) {
    const data = {...req.query};
    seasonsService.list(data)
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
    seasonsService.item(req.params.id)
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
    seasonsService.add(req.body)
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
    seasonsService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;