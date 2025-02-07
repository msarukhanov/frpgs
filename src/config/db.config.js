const connection = process.env.DB_STRING ? {
    connectionString: process.env.DB_STRING
} : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
};

const knex = require('knex')({
    client: 'pg',
    connection,
    acquireConnectionTimeout: 60000,
    pool: {
        min: 0,
        max: 100,
        // acquireTimeoutMillis: 300000,
        // createTimeoutMillis: 300000,
        // destroyTimeoutMillis: 50000,
        // idleTimeoutMillis: 300000,
        // reapIntervalMillis: 10000,
        // createRetryIntervalMillis: 2000,
        propagateCreateError: false
    }
});

knex.raw("SELECT 1").then((res) => {
    if (res.rowCount) {
        console.log("Postgres connected")
    }
});

module.exports = knex;