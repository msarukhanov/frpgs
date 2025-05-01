const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/auth');

const commentsService = require('../../services/app/comments.service');

router.get('/', list);
router.post('/', add);
// router.put('/:id', edit);
// router.get('/:slug', item);

function list(req, res, next) {
    // if(!req.headers.authorization) {
    //     res.json({
    //         error: true,
    //         type: 'auth1'
    //     })
    // }
    const data = {...req.query, token: req.headers.authorization};
    commentsService.list(data)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

// function item(req, res, next) {
//     if(!req.params.slug) {
//         res.send({
//             err: true,
//             type: "params",
//             description: "Missing field."
//         });
//         return;
//     }
//     commentsService.item({...req.params, ...req.query})
//         .then((user) => res.json(user))
//         .catch(err => next(err));
// }

function add(req, res, next) {
    if(!req.body.type || !req.body.text || !req.headers.authorization) {
        res.send({
            err: true,
            type: "params",
            description: "Missing field."
        });
        return;
    }
    const data = {...req.body, token: req.headers.authorization};
    commentsService.add(data)
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
    commentsService.edit(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

module.exports = router;