'use strict';

angular.module('core').controller('HomeController', ['$scope', '$q', 'Authentication', 'Goods', 'Orders', 'Clients', 't',
  function ($scope, $q, Authentication, Goods, Orders, Clients, t) {
    $scope.t = t;
    // This provides Authentication context.
    $scope.authentication = Authentication;

    var goodsData = Goods.query({ limit: 1, page: 1 });
    var ordersData = Orders.query();
    var clientsData = Clients.query();

    $q.all([goodsData.$promise, ordersData.$promise, clientsData.$promise])
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
            count: goodsData.count,
          },
          {
            icon: 'user',
            title: t.MENU_CLIENTS,
            state: 'clients.list',
            actionTitle: t.ADD,
            actionState: 'clients.create',
            actionIcon: 'plus',
            count: clientsData.length,
          }
        ];
      });
  }
]);
