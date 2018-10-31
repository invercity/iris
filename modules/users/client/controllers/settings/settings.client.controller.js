'use strict';

angular.module('users').controller('SettingsController', ['$scope', 'Authentication', 't',
  function ($scope, Authentication, t) {
    $scope.t = t;
    $scope.user = Authentication.user;
  }
]);
