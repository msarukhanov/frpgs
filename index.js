require('dotenv').config();

const express = require('express');
const useragent = require('express-useragent');
const http = require('http');
const cors = require("cors");

const knex = require('./src/config/db.config');
const chat = require('./src/modules/chat').init();

const router = require('./src/controllers');

const app = express();

const httpPort = 80;

app.set('port', httpPort);
app.use(useragent.express());
app.use(cors());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.use(router);

let httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function (err) {
    // console.log(err);
    console.log('Express HTTP server listening on port ' + app.get('port'));
});