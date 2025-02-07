const express = require('express');
const router = express.Router();

router.use('/characters', require('./characters.controller'));
router.use('/chat', require('./chat.controller'));
router.use('/religions', require('./religions.controller'));
router.use('/seasons', require('./seasons.controller'));
router.use('/users', require('./users.controller'));

module.exports = router;
