const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

const helpers = require('../../helpers/global');

const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

// const trafficManagementIntegration = require('../../integrations/trafficManager');

module.exports = {
    me,
    info,
    login,
    create,
    edit,
    logout,
};

async function me({token}) {
    try {
        const query = await knex('users').select('id', 'name', 'username', 'status').where({token});
        if (!query || !query.length) {
            return {
                err: true,
                type: "db"
            };
        }
        return query[0];
    }
    catch (e) {
        console.log(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function info({id}) {
    try {
        const query = await knex('players').select('username', 'id').where({id});
        const item = await query;
        if (item && item.length) {
            return item[0];
        }
        return null;
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function login({username, password}) {
    try {
        const token =  Math.random().toString(36).slice(-10);
        let query = await knex('users').select('id', 'name', 'username', 'status').where({username, password});
        console.log({username, password, query});
        if (query && query.length) {
            const upd = await knex('users').where({id: query[0]['id']}).update({token}, ['id']);
            if (!upd[0] || !upd[0]['id']) {
                return {
                    err: true,
                    type: "db"
                };
            }
            return {...query[0], token};
        }
        return {
            err: true,
            type: "db"
        };
    }
    catch (e) {
        console.error(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function create({name,username,password,status}) {
    try {
        if(!username && !name && !password && !status) {
            return {
                err: true,
                type: "db",
                msg: "Missing fields"
            };
        }
        const token =  Math.random().toString(36).slice(-10);
        let query = await knex('users').insert({
            name,
            username,
            password,
            status,
            token
        }, ['id']);
        if (query && query.length) {
            if (query[0] || query[0]['id']) {
                return {
                    err: true,
                    type: "db"
                };
            }
        }
        return await login({username, password});
    }
    catch (e) {
        console.error(e);
        return {
            err: true,
            type: "db"
        };
    }
}

async function edit({name,username,password,token}) {
    try {
        let data = {};
        if(name) {
            data['name'] = name;
        }
        if(username) {
            data['username'] = username;
        }
        if(password) {
            data['password'] = password;
        }
        const upd = await knex('users').where({token}).update(data, ['id']);
        if (!upd[0] || !upd[0]['id']) {
            return {
                err: true,
                type: "db"
            };
        }
        return {...upd[0], token};
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}

async function logout(token) {
    try {
        const upd = await knex('users').where({token}).update({token: ''}, ['id']);
        if (!upd[0] || !upd[0]['id']) {
            return {
                err: true,
                type: "db"
            };
        }
        return {id: upd[0]['id']};
    }
    catch (e) {
        console.error(e, arguments);
        return {
            err: true,
            type: "db"
        };
    }
}


function group(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

const decrypt = hash => {
    const iv = Buffer.from('8ed6984d26c6efd5629acf0f8b7520b0', "hex");
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);
    return decrpyted.toString()
};