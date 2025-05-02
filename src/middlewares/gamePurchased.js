const knex = require('../config/db.config');

module.exports = async (req, res, next) => {
    try {
        if(req.params.id) {
            const game = await knex('player_games').select('game').where({game:req.params.id, player:req.player});
            if(game && game[0] && game[0]['game']) {
                req.game = game[0]['game'];
                next();
            }
            else {
                res.send({
                    err: true,
                    type: "auth",
                    description: "Game not owned."
                });
            }
        }
        else {
            res.send({
                err: true,
                type: "auth",
                description: "Invalid game id."
            });
        }
    } catch (error) {
        res.status(401).json({ message: "Authentication failed!" })
    }
};