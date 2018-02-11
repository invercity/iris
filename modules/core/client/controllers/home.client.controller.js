'use strict';

angular.module('core').controller('HomeController', ['$scope', '$q', 'Authentication', 'Goods', 'Orders', 't',
  function ($scope, $q, Authentication, Goods, Orders, t) {
    $scope.t = t;
    // This provides Authentication context.
    $scope.authentication = Authentication;

    var goods = Goods.query();
    var orders = Orders.query();

    $q.all([goods.$promise, orders.$promise])
      .then(function () {
        $scope.tabs = [
          {
            icon: 'shopping-cart',
            title: 'Заказы',
            state: 'orders.list',
            actionTitle: 'Добавить заказ',
            actionState: 'orders.create',
            actionIcon: 'plus',
            count: orders.length,
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
