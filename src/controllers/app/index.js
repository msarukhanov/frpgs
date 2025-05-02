const express = require('express');
const router = express.Router();

router.use('/characters', require('./characters.controller'));
router.use('/chat', require('./chat.controller'));
router.use('/comments', require('./comments.controller'));
router.use('/data', require('./data.controller'));
router.use('/games', require('./games.controller'));
router.use('/lobby', require('./lobby.controller'));
router.use('/maps', require('./maps.controller'));
router.use('/parties', require('./parties.controller'));

router.use('/saves', require('./saves.controller'));
router.use('/seasons', require('./seasons.controller'));
router.use('/transactions', require('./transactions.controller'));
router.use('/users', require('./users.controller'));

module.exports = router;
