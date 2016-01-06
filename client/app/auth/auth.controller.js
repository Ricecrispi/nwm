'use strict';

angular.module('nwmApp')
  .controller('AuthCtrl', function ($scope, Restangular, $state) {

    $scope.username = '';
    $scope.password = '';
    $scope.message = '';

    $scope.process = function () {
      return Restangular.all('api/auths/login').post({
        username: $scope.username,
        password: $scope.password
      }).then((function (data) {
        $state.go('scoreboard');
      }), function (err) {
        $scope.message = "Invalid email or password";
      });

      //
      //Restangular.all('api/levels/s/d').getList().then(function(serverJson) {
      //  $scope.blogs = serverJson;
      //  Restangular.all('api/levels/1').getList().then(function(serverJson) {
      //    $scope.blogs = serverJson;
      //
      //  });
      //
      //});
    };
  });
