'use strict';

angular.module('nwmApp').controller('game2Controller', function($scope, Restangular, $stateParams, $localStorage, $state, $timeout, update2, helper, database, style, bucket2, history, aliens) {
  var tutorial = false;
  $scope.maxScore = 0;
  $scope.tutState = -1;

  $scope.$storage = $localStorage;
  $scope.undo_key_pointer = 0;

  // Clear the undo storage
  $( document ).ready(function() {
    delete $scope.$storage.buckets;
    delete $scope.$storage.aliens;
    $scope.setUpGame('best');
  });



  $scope.currentBucket = function(curBucket) {
    // Currently we are using the FIRST highlighting algorithm. Second => 2, Third => 3.
    bucket2.currentBucket(curBucket, 2);
    bucket2.updateAlienArray();
    update2.updateIllegalAlien();
    if (bucket2.buckets[bucket2.current_bucket].alien.length > 0) {
      $scope.checked = true;
      $('#aliens').css('width',  $(window).width() - $('#section').width());
    }
    else {
      $scope.checked = false;
      $('#aliens').css('width', '97%');
    }

    $("#myDiv").height();
  };

  var feedback = function(alienId) {
    $scope.prev_score = $scope.score;
    $scope.score = update2.getNewScore($scope.maxModels);

    if ($scope.score > $scope.maxScore) {
      $scope.maxScore = $scope.score;
    }

    update2.showSmallFeedback($scope.prev_score, $scope.score, alienId);
    update2.showBigFeedback($scope.prev_score, $scope.score, $scope.beat, $scope.highest_score);
  };

  /* Start a new game */
  $scope.setUpGame = function(mode) {
    $scope.bucket = bucket2;
    $scope.aliens = aliens;
    $scope.history = history;

    // $scope.toggleChooseSolutionPopup();
    $scope.dragged = false;  // Disable click event when start dragging
    $scope.checked = false;
    $scope.tutorial = false;
    bucket2.initColors();
    aliens.initAliens();
    history.initHistory();

    // Get top window's height
    $scope.topWindowHeight = window.innerWidth * 0.095 + 20;

    // modelsName is a string in the form of 'level4b6_9'
    // Get level
    console.log($stateParams.id);
    $scope.cur_level = $stateParams.id;

    // Request data from the server
    Restangular.all('api/levels/level/' + $scope.cur_level).getList().then((function (data) {
      $scope.maxModels = data.length;       // number of models
      // Get game id
      if((data[0][0]).indexOf('a') >= 0){
        $scope.cur_game = 1;
      } else{
        $scope.cur_game = 2;
      }

      for (var i = 0; i < $scope.maxModels; i++){
        var maxAliens = data[i][1].length;    // number of aliens in a model
        for (var j = 0; j < maxAliens; j++){
          var parsed_data = database.parseData(data, i, j);
          aliens.properties[i + "_" + j] = parsed_data.attributes;
          aliens.alienArray[i + "_" + j] = {
            id: i + "_" + j,
            model: "model" + i,
            alien: j,
            url: parsed_data.URL,
            color: "rgba(232, 250, 255, 0)",
            illegal: "legal-alien",
            similar: "not-simialr",
            in: false};
        }
      }
      database.shuffleProperties();

      // Set scores
      $scope.get_highest_score();
      $scope.get_greedy();

      // Set buckets
      if (mode == "scratch") {
        $scope.createNewBucket();
      }
      else if (mode == "saved") {
        $scope.restoreSavedBucket();
      }
      else if (mode == "best") {
        $scope.restoreBestGame();
      }

    }), function (err) {
      alert("Unexpected error occured");
    });
  };

  $scope.createNewBucket = function() {
    $scope.newGroup(false);
  }

  $scope.restoreSavedBucket = function() {
    Restangular.all('api/scores/cur_user_solution/' + $scope.cur_level)
      .getList().then(function (serverJson) {

        if (serverJson.length == 0) {
          $scope.createNewBucket();
          return;
        }

        bucket2.buckets = serverJson[0].solution;
        if (serverJson[0].actions != null) {
          history.userActions = serverJson[0].actions;
        }

        // Restore data structures
        for (var i = 0; i < bucket2.buckets.length; i++) {
          bucket2.colorArray.push(bucket2.buckets[i].color);
          bucket2.num_buckets++;

          if (bucket2.predefinedColors[bucket2.buckets[i].color] == false) {
            bucket2.predefinedColors[bucket2.buckets[i].color] = true;
            bucket2.predefinedColorCounter++;
          }

          for (var j = 0; j < bucket2.buckets[i].alien.length; j++) {
            var alien_id = bucket2.buckets[i].alien[j];
            aliens.alienArray[alien_id].color = bucket2.buckets[i].color;
            aliens.alienArray[alien_id].in = true;
          }
        }

        // Create a new bucket
        $scope.score = update2.getNewScore($scope.maxModels);
        if ($scope.score > $scope.maxScore) {
          $scope.maxScore = $scope.score;
        }
        $scope.newGroup(false);
      });
  };

  $scope.restoreBestGame = function() {
    Restangular.all('api/scores/best_solution/' + $scope.cur_level)
      .getList().then(function (serverJson) {

        if (serverJson.length == 0) {
          $scope.createNewBucket();
          return;
        }

        bucket2.buckets = serverJson[0].solution;
        if (serverJson[0].actions != null) {
          history.userActions = serverJson[0].actions;
        }

        // Restore data structures
        for (var i = 0; i < bucket2.buckets.length; i++) {
          bucket2.colorArray.push(bucket2.buckets[i].color);
          bucket2.num_buckets++;

          if (bucket2.predefinedColors[bucket2.buckets[i].color] == false) {
            bucket2.predefinedColors[bucket2.buckets[i].color] = true;
            bucket2.predefinedColorCounter++;
          }

          for (var j = 0; j < bucket2.buckets[i].alien.length; j++) {
            var alien_id = bucket2.buckets[i].alien[j];
            //console.log(alien_id);
            aliens.alienArray[alien_id].color = bucket2.buckets[i].color;
            aliens.alienArray[alien_id].in = true;
          }
        }

        // Set current bucket to index 0
        $scope.score = update2.getNewScore($scope.maxModels);
        if ($scope.score > $scope.maxScore) {
          $scope.maxScore = $scope.score;
        }
        $scope.newGroup(false);
      });
  };

  $scope.selectAlien = function (alien_id) {
    if ($scope.tutState == 3) {
      $scope.tutState = 4;
    }

    if ($scope.tutState == 5) {
      $scope.tutState = 6;
    }

    // Illegal Aliens
    if (aliens.alienArray[alien_id].illegal == 'illegal') {
      if ($scope.tutState == 4) {
        $scope.tutState = 5;
      }



      // Show tutorial if illegal alien tut not done
      // if (!history.tutorials[2]) {
      //   $('#tutorial').accordion({active: 2});
      //   $scope.tutorial = true;
      //   history.tutorials[2] = true;
      // }

      // Find the alien that conflicts with the given alien
      var currentAliens = bucket2.buckets[bucket2.current_bucket].alien;
      for (var i = 0; i < currentAliens.length; i++) {
        var oldId = currentAliens[i];
        if (helper.get_model(alien_id) == helper.get_model(oldId)) {
          aliens.newId = alien_id;
          aliens.oldId = oldId;
          break;
        }
      }
      var oldAlien = document.getElementsByClassName("alien " + oldId)[0];
      //window.scrollTo(0, oldAlien.offsetTop);
      $scope.toggleIllegalAlert();
    }
    else {
      history.historyBuckets = bucket2.buckets;
      history.historyAliensInBucket = aliens.aliensInBucket;
      history.historyAlienId = alien_id;
      history.historyColorArray = bucket2.colorArray;

      // Aliens in other buckets, can be switched to current bucket when being clicked
      if (aliens.alienArray[alien_id].in && bucket2.buckets[bucket2.current_bucket].color != aliens.alienArray[alien_id].color) {

        // // Show tutorial if switching aliens tut not done
        // if (!history.tutorials[3]) {
        //   $scope.tutorial = true;
        //   $('#tutorial').accordion({active: 3});
        //   history.tutorials[3] = true;
        // }

        var bucket_id = bucket2.getBucketByAlienId(alien_id);
        bucket2.buckets[bucket_id].alien.splice(bucket2.buckets[bucket_id].alien.indexOf(alien_id), 1);
        bucket2.buckets[bucket2.current_bucket].alien.push(alien_id);

        history.historyBucketId = bucket2.current_bucket;
        history.historySwappedBucketId = bucket_id;
        history.historySelectFlag = 2;
        history.historyColor = bucket2.buckets[bucket_id].color;
        history.userActions.push("Remove alien " + alien_id + " from bucket " + bucket_id);

        if (bucket2.buckets[bucket_id].alien.length == 0) {
          bucket2.removeBucket(bucket_id);
          if (bucket_id < bucket2.current_bucket) {
            bucket2.current_bucket--;
          }
        }

        aliens.alienArray[alien_id].color = bucket2.buckets[bucket2.current_bucket].color;
        $scope.currentBucket(bucket2.current_bucket);
        feedback(alien_id);
        history.userActions.push("Add alien " + alien_id + " to bucket " + bucket2.current_bucket);
      }

      // Normal aliens
      else {
        if (!$scope.dragged) {
          history.historySelectFlag = false;

          // Alien already in bucket, Deselect aliens
          if (aliens.alienArray[alien_id].color == bucket2.buckets[bucket2.current_bucket].color) {
            if ($scope.tutState == 6) {
              $scope.tutState = 7;
            }


            // Show tutorial if removing alien tut not done
            // if (!history.tutorials[4]) {
            //   $scope.tutorial = true;
            //   $('#tutorial').accordion({active: 4});
            //   history.tutorials[4] = true;
            // }

            history.historySelectFlag = 1;

            // Remove the alien from the bucket
            var ind = bucket2.buckets[bucket2.current_bucket].alien.indexOf(alien_id);
            aliens.alienArray[alien_id].in = false;
            bucket2.buckets[bucket2.current_bucket].alien.splice(ind, 1);

            if (bucket2.buckets[bucket2.current_bucket].alien.length == 0) {
              $scope.checked = false;
            }

            aliens.alienArray[alien_id].color = "rgba(232, 250, 255, 0)";
            $scope.currentBucket(bucket2.current_bucket);
            feedback(alien_id);
            history.userActions.push("Remove alien " + alien_id + " from bucket " + bucket2.current_bucket);
          }

          // Select aliens
          else {
            // Show tutorial if adding alien tut not done
            // if (!history.tutorials[0]) {
            //   $scope.tutorial = true;
            //   $('#tutorial').accordion({active: 0});
            //   history.tutorials[0] = true;
            // }

            history.historySelectFlag = 0;
            bucket2.buckets[bucket2.current_bucket].alien.push(alien_id);

            history.historyBucketId = bucket2.current_bucket;

            aliens.alienArray[alien_id].color = bucket2.buckets[bucket2.current_bucket].color;
            aliens.alienArray[alien_id].in = true;
            $scope.currentBucket(bucket2.current_bucket);
            feedback(alien_id);
            history.userActions.push("Add alien " + alien_id + " to bucket " + bucket2.current_bucket);
          }
        }
      }
    }
  };

  $scope.selectIllegalAlien = function(opt) {
    $scope.toggleIllegalAlert();
    if (!opt) {
      return;
    }
    // Aliens in some other bucket, can be switched to current bucket when being clicked
    if (aliens.alienArray[aliens.newId].in) {
      var bucket_id = bucket2.getBucketByAlienId(aliens.newId);
      bucket2.buckets[bucket_id].alien.splice(bucket2.buckets[bucket_id].alien.indexOf(aliens.newId), 1);
      bucket2.buckets[bucket2.current_bucket].alien[bucket2.buckets[bucket2.current_bucket].alien.indexOf(aliens.oldId)] = aliens.newId;
      history.userActions.push("Remove alien " + aliens.newId + " from bucket " + bucket_id);
      history.userActions.push("Remove alien " + aliens.oldId + " from bucket " + bucket2.current_bucket);

      if (bucket2.buckets[bucket_id].alien.length == 0) {
        bucket2.removeBucket(bucket_id);
        if (bucket_id < bucket2.current_bucket) {
          bucket2.current_bucket--;
        }
      }
    }
    else {
      bucket2.buckets[bucket2.current_bucket].alien[bucket2.buckets[bucket.current_bucket].alien.indexOf(aliens.oldId)] = aliens.newId;
      history.userActions.push("Remove alien " + aliens.oldId + " from bucket " + bucket2.current_bucket);
    }

    aliens.alienArray[aliens.oldId].color = "rgba(232, 250, 255, 0)";
    aliens.alienArray[aliens.oldId].in = false;

    aliens.alienArray[aliens.newId].color = bucket2.buckets[bucket2.current_bucket].color;
    aliens.alienArray[aliens.newId].in = true;
    $scope.currentBucket(bucket2.current_bucket);
    feedback(aliens.newId);

    history.userActions.push("Add alien " + aliens.newId + " to bucket " + bucket2.current_bucket);
  };

  $scope.newGroup = function(tut) {
    // Show tutorial if adding bucket tut not done
    // if (!history.tutorials[1] && tut) {
    //   $scope.tutorial = true;
    //   $('#tutorial').accordion({active: 1});
    //   history.tutorials[1] = true;
    // }
    $scope.checked = false;
    bucket2.addBucket();
    update2.updateIllegalAlien();
  }

  $scope.showGroup = function(alien_id) {
    if ($scope.tutState == 7) {
      $scope.tutState = 8;
    }

    // If alien not in bucket
    if (!aliens.alienArray[alien_id].in) {
      return;
    }
    // If no alien in the current bucket, remove it
    if (bucket2.buckets[bucket2.current_bucket].alien.length == 0) {
      bucket2.removeBucket(bucket2.current_bucket);
    }
    var bid = bucket2.getBucketByAlienId(alien_id);
    $scope.currentBucket(bid);
    bucket2.orderAlienArray();
    bucket2.updateAlienArray();
  }

  $scope.get_highest_score = function (){
    Restangular.all('api/scores/game_scoreboard/' + parseInt($scope.cur_level))
      .getList().then(function (serverJson) {
        $scope.highest_score = serverJson[0].score;
      });
  };
  $scope.get_greedy = function() {
    Restangular.all('api/levels/getBeat/' + parseInt($scope.cur_level))
      .getList().then(function (serverJson) {
        $scope.beat = 1000;
      });
  };

  $scope.onStart = function(event) {
    $scope.dragged = true;
  };

  /*
   * ==========================================
   * ||             UNDO / REDO              ||
   * ==========================================
   */

  // Undo structure: [NEW, OLD, OLD, OLD...]
  //                   ↑ current pointer

  // SCENARIO 1:
  // User clicks UNDO => [NEW, OLD, OLD, OLD...] and update view to current pointer
  //                            ↑ moves pointer backward
  // User clicks REDO => [NEW, OLD, OLD, OLD...] and update view to current pointer
  //                      ↑ moves pointer forward

  // SCENARIO 2:
  // User clicks UNDO  => [NEW, OLD, OLD, OLD...] and update view to current pointer
  //                             ↑ moves pointer backward
  // User makes change => [NEW', OLD, OLD, OLD...] and update view to current pointer
  //                        ↑ moves pointer forward, 'NEW' gets overwritten

  $scope.$watch(angular.bind(bucket2, function (buckets) {
    return bucket2.buckets;
  }), function (newVal, oldVal) {
    if (!newVal || !oldVal || oldVal == []) {
      return;
    }
    console.log("oldVal (buckets) is =>" + JSON.stringify(oldVal));
    console.log("newVal (buckets) is =>" + JSON.stringify(newVal));
    if (!$scope.$storage.buckets) {
      $scope.$storage.buckets = {};
    }

    // Iterate over storage to see if this newVal is from an UNDO (code 1) or from user's new action (code 0)
    var identical_bucket_flag = 1;
    _.forEach($scope.$storage.buckets, function(b, t) { // Caution: value first, key second!
      //console.log("COMPARE newval", b[0] == JSON.stringify(newVal));
      //console.log("COMPARE undo_key_pointer", Number(t) == $scope.undo_key_pointer);
      if (b[0] == JSON.stringify(newVal) && Number(t) == $scope.undo_key_pointer) {
        identical_bucket_flag = 0;
        return false;
      } else if (b[0] == JSON.stringify(newVal) && Number(t) != $scope.undo_key_pointer) {
        identical_bucket_flag = 1;
      }
    });
    // If it is a new action, simply add it to the storage
    if (identical_bucket_flag == 1) {
      var newStamp = new Date().valueOf(); // current timestamp as an integer

      // First bucket
      if (_.keys($scope.$storage.buckets).length == 0) {
        $scope.$storage.buckets[newStamp] =
          [JSON.stringify(newVal), bucket2.current_bucket, null,  null];
      }

      // Not first bucket
      else {
        // bucket storage data structure: {timestampKey: [buckets, current_bucket, lastState, nextState]}
        // Now we want to find the key to lastState
        _.forEach($scope.$storage.buckets, function(b, t) {
          if (b[0] == JSON.stringify(oldVal) && t == $scope.undo_key_pointer) { // Note that the key pointer is still the old one
            // Set lastStep flag for current state and nextStep pointer for last state
            b[3] = newStamp;
            $scope.$storage.buckets[newStamp] =
              [JSON.stringify(newVal), bucket2.current_bucket, $scope.undo_key_pointer,  null];
          }
        });
      }
      // Finally update the key pointer
      $scope.undo_key_pointer = newStamp;
      //console.log("current index =>" + $scope.undo_key_pointer);
    }
    //console.log("storage.buckets => ", $scope.$storage.buckets);
  }, true);

  $scope.undo = function() {
    var last_key = $scope.$storage.buckets[$scope.undo_key_pointer][2];
    if (!last_key) {
      alert("No more UNDOs, man :/");
      return;
    }
    var last_buckets = $scope.$storage.buckets[Number(last_key)];

    var compare_current_buckets = _.pluck(JSON.parse($scope.$storage.buckets[$scope.undo_key_pointer][0]), 'alien').join().split(",");
    var compare_last_buckets = _.pluck(JSON.parse($scope.$storage.buckets[Number(last_key)][0]), 'alien').join().split(",");
    var diff_alien = _.difference(compare_current_buckets, compare_last_buckets);
    //console.log("DIFF1 => " + compare_current_buckets);
    //console.log("DIFF2 => " + compare_last_buckets);
    //console.log("DIFF3 => " + diff_alien);

    // Update key pointer
    $scope.undo_key_pointer = last_key;
    //console.log("current index =>" + $scope.undo_key_pointer);

    if (!last_buckets) {
      alert("undo error");
    }

    bucket2.restoreBucketsHelper(last_buckets);
    $scope.currentBucket(bucket2.current_bucket);
    bucket2.orderAlienArray();
    feedback(diff_alien);
  };

  $scope.redo = function() {
    var next_key = $scope.$storage.buckets[$scope.undo_key_pointer][3];
    if (!next_key) {
      alert("No more REDOs, man :/");
      return;
    }
    var next_buckets = $scope.$storage.buckets[Number(next_key)];

    var compare_current_buckets = _.pluck(JSON.parse($scope.$storage.buckets[$scope.undo_key_pointer][0]), 'alien').join().split(",");
    var compare_next_buckets = _.pluck(JSON.parse($scope.$storage.buckets[Number(next_key)][0]), 'alien').join().split(",");
    var diff_alien = _.difference(compare_current_buckets, compare_next_buckets);

    // Update key pointer
    $scope.undo_key_pointer = next_key;
    //console.log("UNDO (buckets) =>" + next_buckets);

    if (!next_buckets) {
      alert("redo error");
    }

    bucket2.restoreBucketsHelper(next_buckets);
    $scope.currentBucket(bucket2.current_bucket);
    bucket2.orderAlienArray();
    feedback(diff_alien);
  };

  $scope.$on("$destroy", function () {
    //console.log("delete all undo data now...");
    delete $scope.$storage.buckets;
  });

  /*
   * ===========================================
   */

  $scope.buttonReq = '';
  $scope.togglePopup = function(msg, req) {
    $("#overlay").toggle();
    $scope.buttonReq = req;
    $(".alert-msg").html(msg);
    $("#popup").toggle();
  }

  $scope.handleButtonRequest = function() {
    if ($scope.buttonReq == 'submit') {
      $scope.submitScore();
    }
    else if ($scope.buttonReq == 'save') {
      $scope.saveScore();
    }
    else if ($scope.buttonReq == 'quit') {
      $scope.quit();
    }
  }

  // $scope.showHighlightAlien = function(alien_id, enter) {
  //   var element = document.getElementById(alien_id);
  //
  //   if (enter) {
  //     style.scrollToItem(element);
  //     aliens.alienArray[alien_id].highlightHover = 'highlight-hover';
  //     aliens.alienArray[alien_id].zoomedHighlightHover = 'zoomed-highlight-hover';
  //     setTimeout(function(){
  //       aliens.alienArray[alien_id].highlightHover = '';
  //     }, 2000);
  //   } else {
  //     aliens.alienArray[alien_id].zoomedHighlightHover = '';
  //   }
  // }
  $scope.showHighlightAlien = function(alien_id) {
    var target = document.getElementsByClassName("an-alien " + alien_id)[0];
    window.scrollTo(0, target.offsetTop - $scope.topWindowHeight - 10);

    $(".an-alien." + alien_id).removeClass('highlight-hover');
    $(".an-alien." + alien_id).addClass('highlight-hover');
    setTimeout(function(){
      $(".an-alien." + alien_id).removeClass('highlight-hover');
    }, 2000);

    // if (enter) {
    //   style.scrollToItem(element);
    //   $("." + alien_id).addClass('highlight-hover');
    //   $(".zoomed-alien." + alien_id).addClass('zoomed-highlight-hover');
    //   setTimeout(function(){
    //     $("." + alien_id).removeClass('highlight-hover');
    //   }, 2000);
    // } else {
    //   $(".zoomed-alien." + alien_id).removeClass('zoomed-highlight-hover');
    // }
  }

  // Submit the score to the database
  $scope.submitScore = function () {
    if (bucket2.buckets[bucket2.current_bucket].alien.length == 0) {
      bucket2.removeBucket(bucket2.current_bucket);
    }
    Restangular.all('/api/scores/').post(
      {score: $scope.score, game: $scope.cur_game, level: parseInt($scope.cur_level), solution: bucket2.buckets, actions: history.userActions}).then(
      (function (data) {
        $state.go('leaderboard', {prevState: 'game'});
      }), function (err) {
      });
  }

  // Save the score to the database
  $scope.saveScore = function () {
    if (bucket2.buckets[bucket2.current_bucket].alien.length == 0) {
      bucket2.removeBucket(bucket2.current_bucket);
    }
    Restangular.all('/api/scores/save_for_later').post(
      {level: parseInt($scope.cur_level), solution: bucket2.buckets, actions: history.userActions}).then(
      (function (data) {
      }), function (err) {
        $state.go('leaderboard', {prevState: 'game'});
      });
  }

  $scope.logout = function () {
    Restangular.all('api/auths/logout').post(
    ).then((function (data) {
        $state.go('main');
      }), function (err) {

      });
  };

  $scope.quit = function (){
    $state.go('scoreboard');
  };

  // $scope.toggleChooseSolutionPopup = function () {
  //   $("#overlay").toggle();
  //   $("#popup2").toggle();
  // };

  $scope.endGame = function () {
    $("#overlay").toggle();
    $("#popup3").toggle();
  };

  $scope.togglePageslide = function() {
    $scope.checked = !$scope.checked;
  }

  // $scope.$watch
  // (
  //   function () {
  //     return $('#section').width();
  //   },
  //   function (newValue, oldValue) {
  //     if (newValue != oldValue) {
  //       $('.sidenav').css('width', newValue);
  //       $('#aliens').css('width',  $(window).width() - newValue - 40);
  //     }
  //   }
  // );

  $scope.toggleIllegalAlert = function() {
    $(".current-alien." + aliens.oldId).toggleClass("replaced");
    $("#clear-overlay").toggle();
    $("#replace-popup").toggle();
  };

  $scope.goToGroup = function () {
    var alien_id = bucket2.buckets[bucket2.current_bucket].alien[0];
    var element = document.getElementsByClassName(alien_id)[0];
    style.scrollToItem(element);
  };

  window.onresize = function(event) {
    $scope.topWindowHeight = window.innerWidth * 0.095 + 20;
  };

  // var setUpTutorial = function () {
  //   tutorial = true;
  //   $scope.tutState = 0;
  //
  //   /// check whether it's the player's first time playing
  //   // Restangular.all('api/scores/')
  //   //   .get('cur_user_recent').then(function (serverJson) {
  //   //   //alert(serverJson);
  //   //   if (serverJson.score != null) {
  //   //     $scope.tutorialState = 'none';
  //   //   }
  //   // });
  //   ///
  // };

  ///set up game from best solution
  // setUpTutorial();
});
