const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');
const authorizeNS = require('../../middlewares/authNotStrict');

const helpers = require('../../helpers/global');
const usersService = require('../../services/app/users.service');

// router.get('/me', me);
router.route('/me').get(authorize, me);
router.post('/login', login);
router.post('/', create);
router.route('/').put(authorize, edit);
router.route('/logout').post(authorize, logout);

function me(req, res, next) {
    const data = {...req.query, player: req.player};
    usersService.me(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

function login(req, res, next) {
    console.log(req.body);
    // if(req.body.authorization) {
    //     res.send({
    //         err: true,
    //         type: "params",
    //         description: "Invalid request."
    //     });
    //     return;
    // }
    if(!req.body.username || !req.body.password) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    // if(req.body.password) {
    //     req.body.password = helpers.hash(req.body.password);
    // }
    usersService.login(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function create(req, res, next) {
    if(!req.body.username || !req.body.password || !req.body.name) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    if(req.body.password) {
        req.body.password = helpers.hash(req.body.password);
    }
    usersService.create(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function edit(req, res, next) {
    if(
        !req.body.name &&
        (!req.body.password && !req.body.oldPassword) &&
        !req.body.theme &&
        !req.body.lang
    ) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.body, player: req.player};
    usersService.edit(data)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function logout(req, res, next) {
    const data = {...req.query,...req.partner, player_id: req.user_id};
    if((!data.website_id && data.website_id!==0) || !data.partner_id || !data.player_id) {
        res.send({
            err: true,
            type: "params",
            description: "Missing fields"
        });
        return;
    }
    usersService.logout(data.player_id)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;