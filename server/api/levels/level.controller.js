/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/levels              ->  index
 */

'use strict';
var _ = require('lodash');
var config = require('../../config/environment');
var Parse = require('parse/node').Parse;
var fs = require('fs');
var async = require('async');
Parse.initialize(config.PARSE_APPID, config.PARSE_JSKEY);


// Returns a random game for the level specified
exports.getLevelInfo = function(req, res) {
  if (req.session.user) {
    getLevel(req, res);
  } else {
    res.send(400).end();
  };
};

var getLevel = function(req, res) {
  async.waterfall([
    function (callback) {
      var Games = Parse.Object.extend('Games');
      var gamesQuery = new Parse.Query(Games);
      gamesQuery.equalTo('level', parseInt(req.params.id));
      gamesQuery.find({
        success: function(games) {
          var game = randomize(games, 1)[0];
          callback(null, game);
        },
        error: function(error) {
          res.status(500).end();
        }
      });

    },
    function (game, callback) {
      var models = game.relation('models');
      var modelsQuery = models.query();
      modelsQuery.find({
        success: function(models) {
          callback(null, models);
        },
        error: function(error) {
          res.status(500).end();
        }
      });
    },
    function (models, callback) {
      var arr = [];
      async.each(models, function(model, callback) {
        var Model = Parse.Object.extend("Model");
        var aliensQuery = new Parse.Query(Model);
        aliensQuery.equalTo("model", model);
        aliensQuery.find({
          success: function(aliens) {
            arr.push(aliens);
            callback();
          },
          error: function(error) {
            res.status(500).end();
          }
        });
      }, function(err){
        callback(null, arr);
      });
    }
  ], function (err, results) {
    if (err) {
      res.status(500).end();
    } else {
      res.json(results);
    };
  });

};

var randomize = function (arr, num) {
  for(var j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  return arr.slice(0, num);
};

exports.lastUnlockedLevels = function (req, res) {
  if (req.session.user) {
    var Scores = Parse.Object.extend('Scores');
    var scoreQuery = new Parse.Query(Scores);
    scoreQuery.equalTo('user', req.session.user.username);
    scoreQuery.descending('level');
    scoreQuery.limit(1);

    scoreQuery.find({
      success: function (scores) {
        res.json(scores[0].attributes.level);
      },
      error: function (error) {
        res.status(400).end();
      }
    });
  } else {
    res.status(400).end();
  };
};

