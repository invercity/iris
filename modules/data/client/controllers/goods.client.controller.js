'use strict';

// Goods controller
angular.module('data').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, Authentication, Goods, Confirm, t) {
    $scope.t = t;
    $scope.authentication = Authentication;

    $scope.currentPage = 1;
    $scope.itemsPerPage = 20;

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

    $scope.updateList = function () {
      var oldOnly = $scope.selectedOldType ? $scope.selectedOldType.value : undefined;
      var type = $scope.selectedType ? $scope.selectedType.value : undefined;
      Goods.query({
        oldOnly: oldOnly,
        type: type,
        page: $scope.currentPage,
        limit: $scope.itemsPerPage,
        q: $scope.search
      }, function (data) {
        $scope.goods = data.items;
        $scope.goodsCount = data.count;
        $scope.figureOutItemsToDisplay();
      });
    };

    $scope.goodTypes = [
      {
        name: 'Всі',
      },
      {
        name: 'Чоловічі',
        value: 'm'
      },
      {
        name: 'Жіночі',
        value: 'w'
      },
      {
        name: 'Унісекс',
        value: 'uni'
      }
    ];

    $scope.oldTypes = [
      {
        name: 'Всі'
      },
      {
        name: 'Закінчуються',
        value: true
      }
    ];

    $scope.$watch('search', $scope.updateList);

    $scope.onChangeType = function (type) {
      if (type) {
        if ($scope.selectedType) {
          $scope.selectedType.active = false;
        }
        $scope.selectedType = type;
        $scope.selectedType.active = true;
      }
      $scope.updateList();
    };

    $scope.onChangeOldType = function(type) {
      if (type) {
        if ($scope.selectedOldType) {
          $scope.selectedOldType.active = false;
        }
        $scope.selectedOldType = type;
        $scope.selectedOldType.active = true;
      }
      $scope.updateList();
    };

    $scope.find = function () {
      $scope.selectedOldType = $scope.oldTypes[0];
      $scope.selectedOldType.active = true;
      $scope.onChangeType($scope.goodTypes[0]);
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.pagedItems = $scope.goods;
    };

    $scope.pageChanged = function () {
      $scope.onChangeType($scope.selectedType);
      $scope.figureOutItemsToDisplay();
    };
  }
]);
