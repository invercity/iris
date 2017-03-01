'use strict';

// Articles controller
angular.module('goods').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods',
  function ($scope, $stateParams, $location, Authentication, Goods) {
    $scope.authentication = Authentication;

    $scope.remove = function (good) {
      if (good) {
        good.$remove();

        for (var i in $scope.goods) {
          if ($scope.goods[i] === good) {
            $scope.goods.splice(i, 1);
          }
        }
      } else {
        $scope.good.$remove(function () {
          $location.path('goods');
        });
      }
    };

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      var good;

      if ($scope.good) {
        good = $scope.good;

        good.$update(function () {
          $location.path('goods');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        good = new Goods({
          name: this.name,
          count: this.count,
          price: this.price,
          details: this.details,
          type: this.type
        });

        good.$save(function () {
          $location.path('goods');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.find = function () {
      $scope.goods = Goods.query();
    };

    $scope.findOne = function () {
      if ($stateParams.goodId) {
        $scope.good = Goods.get({
          goodId: $stateParams.goodId
        });
      }
      else {
        $scope.price = 0.01;
        $scope.count = 1;
      }
    };
  }
]);
