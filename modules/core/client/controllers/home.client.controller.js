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
            icon: 'shopping-cart',
            title: 'Новые заказы',
            state: 'orders.list',
            actionTitle: 'Добавить заказ',
            actionState: 'orders.create',
            actionIcon: 'plus',
            count: 5,
          },
          {
            icon: 'apple',
            title: 'Товары',
            state: 'goods.list',
            actionTitle: 'Добавить товар',
            actionState: 'goods.create',
            actionIcon: 'plus',
            count: goods.length,
          },
        ];
      });
  }
]);
