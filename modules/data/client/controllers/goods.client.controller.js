'use strict';

// Goods controller
angular.module('data').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, Authentication, Goods, Confirm, t) {
    $scope.t = t;
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

    $scope.find = function () {
      Goods.query(function (data) {
        $scope.goods = data.items;
        $scope.buildPager();
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
          return value && value.toString().toLowerCase().indexOf($scope.search.toLowerCase()) !== -1;
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
