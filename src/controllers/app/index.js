const express = require('express');
const router = express.Router();

router.use('/characters', require('./characters.controller'));
router.use('/chat', require('./chat.controller'));
router.use('/data', require('./data.controller'));
router.use('/maps', require('./maps.controller'));
router.use('/parties', require('./parties.controller'));
router.use('/religions', require('./religions.controller'));
router.use('/seasons', require('./seasons.controller'));
router.use('/users', require('./users.controller'));

module.exports = router;
