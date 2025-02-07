const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const helpers = require('../../helpers/global');
const religionsService = require('../../services/app/religions.service');

router.get('/', list);
router.post('/all', addAll);
router.post('/', add);
router.put('/:id', edit);
router.get('/:id', item);

function list(req, res, next) {
    const data = {...req.query};
    religionsService.list(data)
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
    religionsService.item(req.params.id)
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
    religionsService.add(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function addAll(req, res, next) {
    religionsService.addAll(req.body)
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
    religionsService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;