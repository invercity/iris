'use strict';

// Goods controller
angular.module('data').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods',
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

      var good = $scope.good;

      if ($scope.good._id) {
        good.$update(function () {
          $location.path('goods');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
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
        $scope.title = 'Редактирование товара';
      }
      else {
        $scope.good = new Goods({
          price: 1,
          count: 1
        });
        $scope.title = 'Новый товар';
      }
    };

    $scope.cancel = function () {
      $location.path('goods');
    };
  }
]);
