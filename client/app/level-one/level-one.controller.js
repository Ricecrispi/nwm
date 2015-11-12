angular.module('nwmApp').controller('LevelOneController', ['$scope', function($scope) {
  $scope.alienData = [];   // mapping from an alien id to an array of (model#, alien#, bucket#)
  $scope.buckets = [];
  $scope.num_buckets = 0;  // number of added buckets
  var maxModels = 3;       // number of models
  var maxAliens = 5;       // number of aliens in a model


  // Add the first bucket
  $scope.buckets.push({bucket:0, alien:[]});
  $scope.num_buckets++;

  for (var i = 0; i < maxModels; i++) {
    //$scope.models.push(i);
    $scope.alienData.push({model: i, alien: []});
    for (var j = 0; j < maxAliens; j++) {
      $scope.alienData[i].alien.push({alien:j, img: "app/level-one/backup_aliens/model" + i + "_" + j + ".png"});
    };
  };

  $scope.selectedAlien = function (model_num, alien_num) {
    var alien_id = 'model' + model_num + '_' + alien_num;
    $("#img-container").html("<img width='300px' src='app/level-one/backup_aliens/" + alien_id + ".png' />");
  };

  $scope.addBucket = function() {
    //var newBucket = $("#bucket" + $scope.num_buckets).clone();
    //newBucket.attr('id', 'bucket' + $scope.num_buckets);
    //alert(newBucket.data('id'));
    //newBucket.droppable($('.actual-bucket').droppable());
    //newBucket.droppable($("#bucket" + $scope.num_buckets + " .actual-bucket").droppable('option'));
    //$(newBucket).insertBefore("#add-bucket");
    $scope.buckets.push({bucket:$scope.num_buckets, alien:[]});
    $scope.num_buckets++;
  };


  //Add the droppable bucket id to the alienData of the alien
  $scope.onDrop = function(event, ui) {
    var alienId = ui.draggable.attr('id');
    var bucketId = $(event.target).parent().attr('id');
    var bucket = bucketId.substring(bucketId.length-1, bucketId.length);
    var model = alienId.substring(0, 1);
    var alien = alienId.substring(2, 3);
    $scope.buckets[bucket].alien.push({model: model, alien: alien});

  };

  $scope.putBackAlien = function(model_num, alien_num) {
    for(var m = 0; m < $scope.num_buckets; m++){
      //alert($scope.buckets[m].alien);
      for(var n = 0; n < ($scope.buckets[m].alien).length; n++){
        if($scope.buckets[m].alien[n].model == model_num && $scope.buckets[m].alien[n].alien == alien_num){
          $scope.buckets[m].alien.splice(n, 1);
          // Now loop over alienData to find the index of the alien we want to delete.
          for(var p = 0; p < $scope.alienData[model_num].alien.length; p++){
            if($scope.alienData[model_num].alien[p].alien == alien_num){
              $scope.alienData[model_num].alien.splice(p, 1);
              $scope.alienData[model_num].alien.push({alien:alien_num,
                img: "app/level-one/backup_aliens/model" + model_num + "_" + alien_num + ".png"})
            }
          }
        }
      }
    }
  };

  $scope.deleteBucket = function($event) {
    var id = $($event.target).parent().attr('id');
    var bucket = id.substring(id.length-1, id.length);
    //alert($scope.num_buckets);
    if($scope.buckets[bucket].alien.length>0){
      for (var m = 0; m <  $scope.buckets[bucket].alien.length; m++){
        var model = $scope.buckets[bucket].alien[m].model;
        var alien = $scope.buckets[bucket].alien[m].alien;
        //alert("model: " + model + "alien: " + alien);
        for (var n = 0; n < $scope.alienData[model].alien.length; n++){
          if($scope.alienData[model].alien[n].alien == alien){
            $scope.alienData[model].alien.splice(n, 1);
            $scope.alienData[model].alien.push({alien:alien, img: "app/level-one/backup_aliens/model" + model + "_" + alien + ".png"})
          }
        }
      }
      // Set alien list in buckets[bucket] back to empty.
      $scope.buckets[bucket].alien = [];
    }
    // Remove the bucket
    for (var l = 0; l < $scope.num_buckets; l++){
      if ($scope.buckets[l].bucket == id.substring(id.length-1, id.length)){
        $scope.num_buckets--;
        $scope.buckets.splice(l,1);
      }
    }
  };
}]);
//
///**
// * Created by elsieyang on 2015-11-04.
// */
//
//'use strict';
//(function() {
//
//  function LevelOneController($scope, $http) {
//    var self = this;
//    this.awesomeThings = [];
//
//    //$http.get('/api/levels').then(function(response) {
//    //  self.awesomeThings = response.data;
//    //});
//
//    $scope.modelnum = 1;
//    $scope.aliennum = 1;
//    $scope.models = [];
//    $scope.aliens = [];
//    var maxModels = 3;
//    var maxAliens = 5;
//    for( var i = 0 ; i <= maxModels; i++) {
//      $scope.models.push(i + 1);
//    }
//    for( var j = 0 ; j <= maxAliens; j++){
//      $scope.aliens.push(j + 1);
//    }
//
//  }
//
//  angular.module('levelOne')
//    .controller('LevelOneController', LevelOneController);
//
//})();
