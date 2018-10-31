'use strict';

angular.module('core').controller('ConfirmController', function ($scope, $modalInstance, data, t) {
  $scope.t = t;

  $scope.confirmText = data.confirmText;
  $scope.confirmTitle = data.confirmTitle;
  $scope.confirmValue = data.confirmValue;

  $scope.state = {
    value: 1
  };

  $scope.ok = function () {
    $modalInstance.close($scope.state.value);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
