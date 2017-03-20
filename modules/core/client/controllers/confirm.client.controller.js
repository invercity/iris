'use strict';

angular.module('core').controller('ConfirmController', function ($scope, $modalInstance, data) {

  $scope.confirmText = data.confirmText;
  $scope.confirmTitle = data.confirmTitle;
  $scope.confirmValue = data.confirmValue;

  // just for test
  $scope.$watch('some.value', function () {
    console.log($scope.value);
  });

  $scope.value = 1;

  $scope.ok = function () {
    $modalInstance.close($scope.value);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});