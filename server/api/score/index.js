'use strict';

var express = require('express');
var controller = require('./score.controller');

var router = express.Router();

router.get('/', controller.index);
router.post('/', controller.saveScore);
router.get('/all_overall', controller.getAllOverall);
router.get('/cur_user_game_score/:level_id/:game_id', controller.getCurUserGameScore);
router.get('/game_scoreboard/:level_id/:game_id', controller.getGameScoreboard);
router.get('/cur_user_recent', controller.getCurUserRecentScores);

module.exports = router;
