const knex = require('../config/db.config');

module.exports = async (req, res, next) => {
    try {
        if(req.headers.authorization) {
            const user = await knex('users_sessions').select('user').where({session: req.headers.authorization});
            if(user && user[0] && user[0]['user']) {
                req.player = Number(user[0]['user']);
                next();
            }
        }
        else {
            next();
        }
    } catch (error) {
        res.status(401).json({ message: "Authentication failed!" })
    }
};