'use strict';

angular.module('core').controller('HomeController', ['$scope', '$q', 'Authentication', 'Goods',
  function ($scope, $q, Authentication, Goods) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    var goods = Goods.query();

    $q.all([goods.$promise])
      .then(function () {
        $scope.tabs = [
          {
            icon: 'apple',
            title: 'Товары',
            state: 'goods.list',
            actionTitle: 'Добавить товар',
            actionState: 'goods.create',
            actionIcon: 'plus',
            count: goods.length,
          }
        ];
      });
  }
]);
