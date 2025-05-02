const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const transactionsService = require('../../services/app/transactions.service');

router.route('/').get(authorize, list);
router.route('/').post(authorize, add);

function list(req, res, next) {
    const data = {...req.query, token: req.headers.authorization};
    transactionsService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function add(req, res, next) {
    if(!req.body.type || !req.body.target) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.body, player: req.player};
    transactionsService.add(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;