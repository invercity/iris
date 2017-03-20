'use strict';

// Goods controller
angular.module('data').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods', 'ConfirmService',
  function ($scope, $stateParams, $location, Authentication, Goods, Confirm) {
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
      Goods.query(function (data) {
        $scope.goods = data;
        $scope.buildPager();
      });
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

    $scope.add = function (good) {
      Confirm.showValue({
        title: 'Добавление товара',
        text: 'Введите колличество:',
        value: true
      }, function (count) {
        good.count += count;
        good.$update();
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = _.filter($scope.goods, function (good) {
        if (!$scope.search) return true;
        var fields = [
          'code',
          'name',
          'details',
          'country',
          'type'
        ];
        return _.some(fields, function (field) {
          var value = _.get(good, field);
          return value && value.toString().indexOf($scope.search) !== -1;
        });
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);
