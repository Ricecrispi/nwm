
var levelOne = angular.module('nwmApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('game', {
        url: '/game/:id',
        templateUrl: 'app/level-one/level-one.html',
        controller: 'LevelOneController'
      });
  });

levelOne.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(event) {
      scope.$apply(function() {
        event.preventDefault();
        fn(scope, {$event:event});
      });
    });
  };
});

levelOne.filter('toArray', function() { return function(obj) {
  if (!(obj instanceof Object)) return obj;
  return _.map(obj, function(val, key) {
    return Object.defineProperty(val, '$key', {__proto__: null, value: key});
  });
}});

/*******************************************************************
  DB functions / parsing functions
*******************************************************************/
levelOne.service('database', function(Restangular, $state, aliens) {

  /* Returns alien data given model and alien numbers. */
  this.parseData = function(data, i, j){
    var retVal = _.find(data[i][1], function (alien) {
      var m = alien.modelsName.split(/a|b/)[1].split("_")[0];
      var a = alien.modelsName.split(/a|b/)[1].split("_")[1];
      return (m == (i + 1)) && (a == j);
    });
    return retVal;
  };

  /* Shuffle given array and returns the new array. */
  Array.prototype.shuffle = function(){
    for (var i = 0; i < this.length; i++){
      var a = this[i];
      var b = Math.floor(Math.random() * this.length);
      this[i] = this[b];
      this[b] = a;
    }
  }

  this.shuffleProperties = function() {
    var new_obj = {};
    var keys = getKeys(aliens.alienArray);
    keys.shuffle();
    for (var key in keys){
      if (key == "shuffle") continue; // skip our prototype method
      new_obj[keys[key]] = aliens.alienArray[keys[key]];
    }
    aliens.alienArray = new_obj;
  }

  function getKeys(obj){
    var arr = new Array();
    for (var key in obj)
      arr.push(key);
    return arr;
  }
  //this.getShuffledArray = function(array) {
  //  var len = Object.keys(array).length;
  //  for (var i = len - 1; i > 0; i--) {
  //    var j = Math.floor(Math.random() * (i + 1));
  //    var temp = array[i];
  //    array[i] = array[j];
  //    array[j] = temp;
  //  }
  //  return array;
  //};
});


/*******************************************************************
  Manage arrays of aliens
*******************************************************************/
levelOne.service('aliens', function() {

  this.initAliens = function() {
    this.properties = {};
    this.zoominAliens = [];
    this.alienArray = {};
  }

});


/*******************************************************************
  Helper functions
*******************************************************************/
levelOne.service('helper', function() {

  // Returns alien num given alien ID of the form 0_0
  this.get_model = function(ID){
    var modelNum = ID.split("_")[0];
    return modelNum;
  };

  // Returns model num given alien ID of the form 0_0
  this.get_alien = function(ID){
    var alienNum = ID.split("_")[1];
    return alienNum;
  };

  // Source: http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
  this.shuffleArray = function(arr) {
    var retArray = [];

    arr.forEach(function(aid) {
      retArray.push(aid);
    });

    var j, x, i;
    for (i = retArray.length; i; i--) {
      j = Math.floor(Math.random() * i);
      x = retArray[i - 1];
      retArray[i - 1] = retArray[j];
      retArray[j] = x;
    }

    return retArray;
  };

});


/*******************************************************************
  Functions to update data (i.e. illegal aliens)
*******************************************************************/
levelOne.service('update',function(helper, bucket, aliens, style) {

  /* Returns an array of illegal aliens. */
  this.updateIllegalAlien = function() {

    // Array of models that are already in bucket
    var models_in_bucket = [];
    for (var i = 0; i < bucket.buckets[bucket.current_bucket].alien.length; i++) {
      var model_num = helper.get_model(bucket.buckets[bucket.current_bucket].alien[i]);
      if (models_in_bucket.indexOf(model_num) == -1) {
        models_in_bucket.push(model_num);
      }
    }

    for (var id in aliens.alienArray) {
      model_num = helper.get_model(id);
      if (models_in_bucket.indexOf(model_num) != -1 && bucket.buckets[bucket.current_bucket].alien.indexOf(id) == -1) {
        aliens.alienArray[id].illegal = 'illegal';
      }
      else {
        aliens.alienArray[id].illegal = 'legal';
      }
    }
  };

  /* Return the new score and gives feedback. */
  this.getNewScore = function(maxModels) {
    var buckets={};
    // Calculate points for each bucket
    var total_score = 0;
    bucket.highestAlienScore = 0;
    for (var i = 0; i < bucket.buckets.length; i++) {
      var bucket_score  = calculateScoreByBucket(bucket.buckets[i].alien, maxModels);
      buckets[bucket.buckets[i].alien] = bucket_score;

      var ceil_bucket_score = Math.ceil(bucket_score);
      for (var j = 0; j < bucket.buckets[i].alien.length; j++) {
        var curAlien = bucket.buckets[i].alien.splice(j, 1)[0];
        var alienScore = ceil_bucket_score - Math.ceil(calculateScoreByBucket(bucket.buckets[i].alien, maxModels))
        if (alienScore > bucket.highestAlienScore) {
          bucket.highestAlienScore = alienScore;
        }
        aliens.alienArray[curAlien].score = alienScore;
        bucket.buckets[i].alien.splice(j, 0, curAlien);
      }
      bucket.buckets[i].similarity = ceil_bucket_score;
      total_score += bucket_score;
      if (bucket_score > bucket.highestBucketScore) {
        bucket.highestBucketScore = ceil_bucket_score;
      }
    }
    return {score: Math.ceil(total_score), breakdown: buckets};

  };

  /* Calculate the score of the bucket that contains the
     aliens in alien_list
     alien_list: [{model, alien} ...]  */
  var calculateScoreByBucket = function (alien_list, maxModels) {
    var num_dup  = {};   // a map from j -> number of properties that appear in j aliens in the bucket
    var prop_list = [];  // a list of unique properties in the bucket
    for (var i = 0; i < alien_list.length; i++) {
      // a list of properties of the current alien
      var cur_properties = aliens.properties[alien_list[i]];
      for (var k = 0; k < cur_properties.length; k++) {
        if (prop_list.indexOf(cur_properties[k]) == -1) {
          // the property is not in prop_list yet
          var compare_result = compare(cur_properties[k], alien_list);
          if (compare_result >= 2) {
            // the property appears in more than one alien in the bucket
            if (num_dup[compare_result] == null) {
              // value of 'j' is not in num_dup yet
              num_dup[compare_result] = 1;
            } else {
              num_dup[compare_result]++;
            }
          }
          prop_list.push(cur_properties[k]);
        }
      }
    }

    var score = 0;
    for (var j in num_dup) {
      score += j * j * num_dup[j] / (maxModels * maxModels * prop_list.length) * 10000;
    }
    return score;
  };



  /* Returns the number of aliens in the given bucket
     that have the given attribute. */
  var compare = function(prop_id, alien_list) {
    var num_occurrence = 0;
    for (var i = 0; i < alien_list.length; i++) {
      var cur_properties = aliens.properties[alien_list[i]];
      if (cur_properties.indexOf(prop_id) != -1) {
        num_occurrence++;
      }
    }
    return num_occurrence;
  };

  this.showSmallFeedback = function(oldScore, newScore, alien_id) {
    //var element = document.getElementById(alien_id);
    //var coord_x = element.offsetLeft - element.scrollLeft + 20;
    //var coord_y = element.offsetTop - element.scrollTop - 20;

    var coord_x = Math.floor(window.innerWidth/2) - 300;
    var coord_y = Math.floor(window.innerHeight/2) - 100;

    $("#feedback").css({'font-family': 'Lovelo Black',
      'text-shadow': 'none',
      'position': 'fixed',
      'left': coord_x + 170,
      'top': coord_y + 60,
      'font-size': '100px',
      'z-index': '99'});

    // Small feedback
    if (oldScore < newScore) {
      var diff = newScore - oldScore;
      $("#feedback").html(diff);
      $("#small_feedback").removeClass('glyphicon glyphicon-arrow-down');
      $("#small_feedback").addClass('glyphicon glyphicon-arrow-up animated rubberBand');
      $("#small_feedback").css({'color': '#77dd77',
                                'position': 'fixed',
                                'left': coord_x,
                                'top': coord_y,
                                'font-size': '100px',
                                'z-index': '99'});
      $("#feedback").css({'color': '#77dd77'});
      $("#feedback").show().delay(500).fadeOut();
      $("#small_feedback").show().delay(500).fadeOut();
    }
    else if (oldScore > newScore) {
      var diff = oldScore - newScore;
      $("#feedback").html(diff);
      $("#small_feedback").removeClass('glyphicon glyphicon-arrow-up');
      $("#small_feedback").addClass('glyphicon glyphicon-arrow-down animated rubberBand');
      $("#small_feedback").css({'color': '#f63c3a',
                                'position': 'fixed',
                                'left': coord_x,
                                'top': coord_y,
                                'font-size': '100px',
                                'z-index': '99'});
      $("#feedback").css({'color': '#f63c3a'});
      $("#feedback").show().delay(500).fadeOut();
      $("#small_feedback").show().delay(500).fadeOut();
    }
  };

  this.showBigFeedback = function(oldScore, newScore, greedyScore, highestScore) {

    var higher = Math.max(greedyScore, highestScore);

    if (oldScore < newScore) {
      if (newScore >= higher * 5 / 5) {
        this.feedback = "Best!";
        $("#feedback").show().delay(500).fadeOut();
      }
      else if (newScore >= higher * 4 / 5) {
        this.feedback = "Amazing!";
        $("#feedback").show().delay(500).fadeOut();
      }
      else if (newScore >= higher * 3 / 5) {
        this.feedback = "Wow!";
        $("#feedback").show().delay(500).fadeOut();
      }
      else if (newScore >= higher * 2 / 5) {
        this.feedback = "Good!";
        $("#feedback").show().delay(500).fadeOut();
      }
    }
  };
});


/*******************************************************************
  Handles highlighting
*******************************************************************/
levelOne.service('style', function(aliens, helper) {

  this.lowLightSimilarAliens = function() {
    for (var id in aliens.alienArray) {
      aliens.alienArray[id].similar = "dissimilar";
    }
  };

  this.highLight = function(alien_id, bucket, method_flag) {
    // Get all aliens in current bucket.
    var highlightedSet = [];
    var members = bucket.alien;

    for (var id in aliens.alienArray) {
      // If it is already in current bucket, we don't want it.
      // if (members.indexOf(id) >= 0) {
      //   continue;
      // }
      if (aliens.zoominAliens.indexOf(id) >= 0) {
        continue;
      }

      var model_num = helper.get_model(id);
      var alien_num = helper.get_alien(id);

      // Do not highlight if the alien is from the same model as the seeed
      if (bucket.alien[0] && helper.get_model(bucket.alien[0]) == model_num) {
        continue;
      }

      // a list of properties of the current alien
      var cur_properties = aliens.properties[id];


      var checkAnyFlag = false;
      var checkAllFlag = true;
      var similarCounter = 0;
      // Loop over all aliens in current group and compare with current alien in outer for loop.
      _.each(members, function(member) { // Each memeber here is an alien ID
        var member_model_num = helper.get_model(member);
        var member_alien_num = helper.get_alien(member);
        var member_props = aliens.properties[member];

        if (!_.isEmpty(_.intersection(cur_properties, member_props))) {
          // If the current alien has a common attribute with a member, we want it for method_flag = 1.
          checkAnyFlag = true;
          similarCounter += (_.intersection(cur_properties, member_props)).length;
        }

        else {
          // If the current alien has no common attribute with a member, we don't want it for method_flag = 2.
          checkAllFlag = false;
        }
      });

      if (
          /* highlight only if alien has at least one same attribute with ANY alien in current bucket*/
          (method_flag == 1 && checkAnyFlag) ||
          /* highlight only if alien has at least one same attribute with ALL aliens in current bucket */
          (method_flag == 2 && checkAllFlag) ||
          /* highlight only if alien’s # of similar attributes across all members of
          current bucket >= the # of members in group */
          (method_flag == 3 && similarCounter >= members.length*0.8)
      ) {
        aliens.alienArray[id].similar = 'similar';
        aliens.zoominAliens.push(id);
        highlightedSet.push(aliens.alienArray[id].color);
      }
    }


    for (var id in aliens.alienArray) {
      var inHighlightedBucket = false;
      var i;
      for (i = 0; i < highlightedSet.length; i++) {
        if (highlightedSet[i] == aliens.alienArray[id].color) {
          inHighlightedBucket = true;
        }
      }

      if (!inHighlightedBucket) {
        aliens.alienArray[id].isHidden = "hidden-alien";
      } else {
        aliens.alienArray[id].isHidden = "shown-alien";
      }
    }
  };

  this.scrollToItem = function(item) {
    var diff=(item.offsetTop - window.scrollY)/8;
    if (Math.abs(diff) > 1) {
      window.scrollTo(0, (window.scrollY + diff));
      clearTimeout(window._TO);
      window._TO=setTimeout(this.scrollToItem, 30, item);
    } else {
      window.scrollTo(0, item.offsetTop)
    }
  }
});


/*******************************************************************
  Handles buckets, colour array, predefined colours
*******************************************************************/
levelOne.service('bucket', function(style, $timeout, aliens, history) {

  this.initColors = function() {
    this.predefinedColors = {};

    var hue_list = ['red', 'green', 'orange', 'blue', 'purple', 'pink'];
    for (var i = 0; i < 40; i++) {
      var random_color = randomColor({
        luminosity: 'bright',
        format: 'hex',
        hue: hue_list[Math.floor(Math.random() * 6)]
      });

      // Regenerate if already in the list.
      while(Object.keys(this.predefinedColors).indexOf(random_color) != -1) {
        random_color = randomColor({
          luminosity: 'bright',
          format: 'hex',
          hue: hue_list[Math.floor(Math.random() * 6)]
        });
      }

      this.predefinedColors[random_color.toString()] = false;
    }

    this.predefinedColorCounter = 0;
    this.buckets = [];
    this.num_buckets = 0;
    this.current_bucket = -1;
    this.colorArray = [];
    this.highestBucketScore = 0;
  }

  this.restoreBucketsHelper= function (data) {
    this.predefinedColorCounter = 0;
    this.num_buckets = 0;
    this.current_bucket = data[1];
    this.colorArray = [];
    this.buckets = JSON.parse(data[0]);

    // Clear all the previous alien color background and in attributes
    _.each(aliens.alienArray, function (a) {
      a.color = "#ffffff";
      a.in = false;
    });

    // Restore data structures
    for (var i = 0; i < this.buckets.length; i++) {
      this.colorArray.push(this.buckets[i].color);
      this.num_buckets++;

      if (this.predefinedColors[this.buckets[i].color] == false) {
        this.predefinedColors[this.buckets[i].color] = true;
        this.predefinedColorCounter++;
      }

      for (var j = 0; j < this.buckets[i].alien.length; j++) {
        var alien_id = this.buckets[i].alien[j];
        aliens.alienArray[alien_id].color = this.buckets[i].color;
        aliens.alienArray[alien_id].in = true;
      }
    }
  }

  /* Returns an array of all highlighted aliens */
  this.currentBucket = function(curBucket, method_flag) {
    this.current_bucket = curBucket;

    // Free similar aliens
    style.lowLightSimilarAliens();
    aliens.zoominAliens = [];

    // Highlight aliens that are similar to aliens in current bucket
    var cur_alien_list = this.buckets[curBucket].alien;
   // for (var j = 0; j < cur_alien_list.length; j++) {
      style.highLight(cur_alien_list[0], this.buckets[curBucket], method_flag);
    //}
  };

  /* Update the array of colours and returns. */
  this.addBucket = function() {
    var color = this.getRandomColor();
    this.buckets.push({alien:[], color:color, similarity:0});
    this.num_buckets++;
    var bucket_ind  = this.num_buckets - 1;
    this.colorArray.push(color);
    history.userActions += "Create bucket " + bucket_ind + "|";
    this.currentBucket(bucket_ind);
    this.updateAlienArray();
  };

  this.getRandomColor = function() {
    if (this.predefinedColorCounter != Object.keys(this.predefinedColors).length) {
      for (var color in this.predefinedColors) {
        // Colour available
        if (!this.predefinedColors[color]) {
          this.predefinedColors[color] = true;
          this.predefinedColorCounter++;
          return color;
        }
      }
    }
    var hue_list = ['red', 'green', 'orange', 'blue', 'purple', 'pink'];

    color = randomColor({
      luminosity: 'random',
      format: 'hex',
      hue: hue_list[Math.floor(Math.random() * 6)]
    });

    return color;
  };

  /* Update predefined colours when bucket_id is removed */
  this.updatePredefinedColor = function(bucket_id) {
    if (this.predefinedColors[this.buckets[bucket_id].color] == true) {
      this.predefinedColors[this.buckets[bucket_id].color] = false;
      this.predefinedColorCounter--;
    }
  };

  this.removeBucket = function(bid) {
    history.userActions += "Remove bucket " + bid;
    this.updatePredefinedColor(bid);
    this.buckets.splice(bid, 1);
    this.colorArray.splice(bid, 1);
    this.num_buckets--;
  }

  /* Returns a bucket ID which alien_id belongs to */
  this.getBucketByAlienId = function(alien_id) {
    for (var i = 0; i < this.buckets.length; i++) {
      if (aliens.alienArray[alien_id].color == this.buckets[i].color) {
        return i;
      }
    }
  };

  this.getAlienScore = function(alienId) {
    if (!aliens.alienArray[alienId].in) {
      return -1;
    }
    if (aliens.alienArray[alienId].score < 0) {
      return 0;
    }
    return aliens.alienArray[alienId].score/this.highestAlienScore * 100;
  };

  this.updateAlienArray  = function() {
    for (var i = 0; i < this.orderedIds.length; i++) {
      var aid = this.orderedIds[i];
      var strippedAid = aid.substr(1);
      // Alien in current bucket: should display an empty space
      if (aid[0] != "_") {
        if (aliens.alienArray[aid].color == this.buckets[this.current_bucket].color) {
          this.orderedIds[i] = "_" + aid;
        }
        aliens.alienArray[aid].similarityBar = this.getAlienScore(aid);
      }
      // Alien not in current bucket: put it back to the list
      else if (aid[0] == "_") {
        if (aliens.alienArray[strippedAid].color != this.buckets[this.current_bucket].color) {
          this.orderedIds[i] = strippedAid;
        }
        aliens.alienArray[strippedAid].similarityBar = this.getAlienScore(strippedAid);
      }
    }

    // No buckt selected
    if (this.current_bucket == -1) {
      this.currentAliens = [];
    }
    else {
      this.currentAliens = this.buckets[this.current_bucket].alien;
    }
  }

  this.orderAlienArray = function() {
    this.orderedIds = [];

    for (var id in aliens.alienArray) {
      if (!aliens.alienArray[id].in) {
        this.orderedIds.push(id);
      }
    }

    var sortedBucket = [];
    for (var i = 0; i < this.buckets.length; i++) {
      sortedBucket.push(this.buckets[i]);
    }

    sortedBucket.sort(function(a, b) {
      return a.similarity - b.similarity;
    });

    for (i = 0; i < sortedBucket.length; i++) {
      this.orderedIds = this.orderedIds.concat(sortedBucket[i].alien);
    }

    // for (var i = 0; i < this.buckets.length; i++) {
    //   this.orderedIds = this.orderedIds.concat(this.buckets[this.buckets.length - 1 - i].alien);
    // }

    // No buckt selected
    if (this.current_bucket == -1) {
      this.currentAliens = [];
    }
    else {
      this.currentAliens = this.buckets[this.current_bucket].alien;
    }
  };

  this.getBucketScore = function(alienId) {
    if (!aliens.alienArray[alienId].in) {
      return 0;
    }
    var bucketId = this.getBucketByAlienId(alienId);
    if (alienId != this.buckets[bucketId].alien[0]) {
      return 0;
    }
    return this.buckets[bucketId].similarity/this.highestBucketScore * 100;
  };
});

levelOne.service('history', function(aliens) {

  this.initHistory = function() {
    this.historyBuckets = [];
    this.historyAliensInBucket = [];
    this.historyAlienId = '';
    this.historyBucketId = '';
    this.historySelectFlag = 0; // 0 means previously selected, 1 means previously unselected, 2 means previously swapped
    this.historyColor = '';
    this.historySwappedBucketId = '';
    this.historyColorArray = [];
    this.userActions = " ";
    // 0:'add-alien'
    // 1:'illegal-alien'
    // 2:'create-group'
    // 3:'switch-aliens'
    // 4:'removing alien'
    // 5:'highlight'
  }
});
