const knex = require('../config/db.config');

module.exports = async (req, res, next) => {
    if(!req.params.id) {
        res.send({
            err: true,
            type: "auth",
            description: "Invalid game id."
        });
        return;
    }
    try {
        const game = await knex('games').select('id').where({id:req.params.id, owner:req.player});
        if(game && game[0] && game[0]['id']) {
            next();
        }
        else {
            res.send({
                err: true,
                type: "auth",
                description: "Game not owned."
            });
        }
    } catch (error) {
        res.status(401).json({ message: "Authentication failed!" })
    }
};