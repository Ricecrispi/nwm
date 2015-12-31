/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/scores              ->  index
 */

'use strict';

// Gets a list of Scores
exports.index = function(req, res) {
  res.json([]);
};

exports.saveScore = function(req, res) {
  var score = req.params.score;
  var game = req.params.game;
  var level = req.params.level;
  var user = Parse.User.current();

  var Scores = Parse.Object.extend("Scores");
  var newScore = new Scores();
  newScore.set("game", game);
  newScore.set("level", level);
  newScore.set("user", user);
  newScore.set("score", score);

  newScore.save(null, {
    success: function(gameScore) {
      updateOverallScore(user, game, level, score);
    },
    error: function(gameScore, error) {
      res.setStatus(400);
    }
  });
};

var updateOverallScore = function (user, game, level, score) {
  var Scores = Parse.Object.extend("Scores");
  var scoreQuery = new Parse.Query(Scores);
  scoreQuery.equalTo("game", game);
  scoreQuery.equalTo("level", level);
  scoreQuery.equalTo("user", user);
  scoreQuery.descending("score");

  query.first({
    success: function(curHighest) {
      if (curHighest.attributes.score > score) {
        Parse.User.current().set("overallScore", Parse.User.current().attributes.overallScore -
          curHighest.attributes.score + score);
        res.setStatus(200);
      } else {
        res.setStatus(200);
      }
    },
    error: function(error) {
    }
  });


};
