const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');

module.exports = {
    getView,
    getEdit,
};

async function getView() {
    return {
        err: true,
        type: "db"
    };
}

async function getEdit() {
    return {
        err: true,
        type: "db"
    };
}