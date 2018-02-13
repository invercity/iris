'use strict';

angular.module('core').controller('HomeController', ['$scope', '$q', 'Authentication', 'Goods', 'Orders', 't',
  function ($scope, $q, Authentication, Goods, Orders, t) {
    $scope.t = t;
    // This provides Authentication context.
    $scope.authentication = Authentication;

    var goodsData = Goods.query();
    var ordersData = Orders.query();

    $q.all([goodsData.$promise, ordersData.$promise])
      .then(function () {
        $scope.tabs = [
          {
            icon: 'shopping-cart',
            title: $scope.t.ORDERS_LIST,
            state: 'orders.list',
            actionTitle: $scope.t.ADD,
            actionState: 'orders.create',
            actionIcon: 'plus',
            count: ordersData.count,
          },
          {
            icon: 'apple',
            title: t.GOODS,
            state: 'goods.list',
            actionTitle: t.ADD,
            actionState: 'goods.create',
            actionIcon: 'plus',
            count: goodsData.length,
          },
        ];
      });
  }
]);
