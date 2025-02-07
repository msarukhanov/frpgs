const knex = require('../config/db.config');


module.exports = async (req, res, next) => {
    try {
        if(req.headers.authorization) {
            const user = await knex('users').select('id', 'type', 'system_id', 'permissions', 'partner_id').where({token: req.headers.authorization});
            let agentQuery;
            if(user && user[0] && user[0]['id']) {
                req.user_id = user[0]['id'];
                req.partner_id = user[0]['partner_id'];
                req.query.user_type = user[0]['type'];
                req.permissions = user[0]['permissions'] || [];
                switch (req.query.user_type) {
                    case 'manager':
                        req.query['system_id'] = user[0]['system_id'];
                        req.query['partner_id'] = user[0]['partner_id'];
                        break;
                    case 'agent':
                        req.query['system_id'] = user[0]['system_id'];
                        req.query['agent_id'] = user[0]['system_id'];
                        agentQuery = await knex('agents').select('partner_id', 'childAgent').where({id: user[0]['system_id']});
                        req.query['isChildAgent'] = agentQuery[0]['isChildAgent'];
                        req.query['partner_id'] = agentQuery[0]['partner_id'];
                        break;
                    case 'partner':
                        req.query['system_id'] = user[0]['system_id'];
                        req.query['partner_id'] = user[0]['system_id'];
                        let partnerQuery = await knex('partners').select('group_role').where({id: user[0]['system_id']});
                        req.query['type'] = partnerQuery[0]['group_role'] === 'admin' ? 'admin' : 'partner';
                        req.query.user_type = req.query['type'];
                        break;
                    case 'user':
                        req.query['partner_id'] = user[0]['partner_id'];
                        req.query.user_type = req.query['type'];
                        break;
                }
                req.partner_id = req.query['partner_id'];
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
        console.log(error);
        res.status(401).json({ message: "Authentication failed!" })
    }
};
