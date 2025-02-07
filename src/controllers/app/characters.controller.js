const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const charactersService = require('../../services/app/characters.service');

router.get('/', list);
router.post('/', add);
// router.put('/:id', edit);
router.get('/:slug', item);

function list(req, res, next) {
    const data = {...req.query};
    charactersService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function item(req, res, next) {
    if(!req.params.slug) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    charactersService.item({...req.params, ...req.query})
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
    charactersService.add(req.body)
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
    charactersService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;