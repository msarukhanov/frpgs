const express = require('express');
const router = express.Router();

router.use('/api/app', require('./app'));

module.exports = router;
