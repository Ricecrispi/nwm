'use strict';

angular.module('nwmApp')
  .controller('PropertiesCtrl', function ($scope) {
    $scope.properties = [];
    var path = 'http://individual.utoronto.ca/elsieyoung/FeiAliens/';

    var i;
    for (i = 1; i <= 162; i++) {
      $scope.properties.push(path + i.toString() + '.png');
    }

  });
