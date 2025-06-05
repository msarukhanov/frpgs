const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');
const gamePurchased = require('../../middlewares/gamePurchased');

const savesService = require('../../services/app/saves.service');

router.route('/').get(authorize, list);
router.route('/').post(authorize, add);
router.route('/auto').post(authorize, add);
router.route('/').put(authorize, edit);
router.route('/:id').get(authorize, item);

function list(req, res, next) {
    const data = {...req.query, player : req.player};
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
    const data = {...req.params, player : req.player};
    savesService.item(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function add(req, res, next) {
    if(!req.body.character||!req.body.game||!req.body.data) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, ...req.body, player : req.player};
    savesService.add(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function edit(req, res, next) {
    if(!req.body.game || !req.body.save || !req.params.id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.params, ...req.body, player : req.player};
    savesService.edit(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;