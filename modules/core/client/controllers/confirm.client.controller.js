'use strict';

angular.module('core').controller('ConfirmController', function ($scope, $modalInstance, data) {

  $scope.confirmText = data.confirmText;
  $scope.confirmTitle = data.confirmTitle;

  $scope.ok = function () {
    $modalInstance.close(true);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});