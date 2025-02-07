const knex = require('../config/db.config');


module.exports = async (req, res, next) => {
    try {
        if(req.headers.authorization) {
            const user = await knex('players').select('id','partner_id','casino_session').where({token: req.headers.authorization});
            if(user && user[0] && user[0]['id']) {
                req.user_id = user[0]['id'];
                req.partner_id = user[0]['partner_id'];
                next();
                return;
            }
        }
        res.send({
            err: true,
            type: "auth",
            description: "Invalid token."
        });
        // validation...
    } catch (error) {
        res.status(401).json({ message: "Authentication failed!" })
    }
};