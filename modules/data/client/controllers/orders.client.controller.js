'use strict';

// Order controller
angular.module('data').controller('OrdersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Orders', 'Goods', 'Clients',
  function ($scope, $stateParams, $location, Authentication, Orders, Goods, Clients) {

    $scope.authentication = Authentication;
    $scope.currency = ' UAH';

    $scope.remove = function (order) {
      if (order) {
        order.$remove();

        for (var i in $scope.orders) {
          if ($scope.orders[i] === order) {
            $scope.orders.splice(i, 1);
          }
        }
      } else {
        $scope.order.$remove(function () {
          $location.path('orders');
        });
      }
    };

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'orderForm');

        return false;
      }

      var order = $scope.order;

      if ($scope.order._id) {
        order.$update(function () {
          $location.path('orders');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        order.$save(function () {
          $location.path('orders');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.find = function () {
      $scope.orders = Orders.query();
    };

    $scope.findOne = function () {
      if ($stateParams.orderId) {
        $scope.order = Orders.get({
          orderId: $stateParams.orderId
        });
        $scope.title = 'Редактирование заказа';
      }
      else {
        $scope.order = new Orders();
        $scope.title = 'Новый заказ';
        $scope.order.client = 0;
        $scope.addItem();
      }

      $scope.goods = Goods.query();
      $scope.clients = Clients.query();
    };

    $scope.calculate = function (price, count) {
      if (!isNaN(price) && !isNaN(count)) {
        return (price * count).toFixed(2) + $scope.currency;
      }
      return 0 + $scope.currency;
    };

    $scope.addItem = function () {
      var defaultItem = {
        count: 1,
      };
      if ($scope.goods && $scope.goods.length) {
        // defaultItem.good = $scope.goods[0];
      }
      if (!$scope.order.items) {
        $scope.order.items = [];
      }

      $scope.order.items.push(defaultItem);
    };

    $scope.calculateTotal = function () {
      if (!$scope.order.items) return;
      var total = 0;
      for (var i=0;i<$scope.order.items.length;i++) {
        var item = $scope.order.items[i];
        if (item.good && item.good.price && item.count) {
          total += (item.good.price * item.count);
        }
      }
      return total.toFixed(2) + $scope.currency;
    };

    $scope.cancel = function () {
      $location.path('orders');
    };

    $scope.removeItem = function (item) {
      for (var i in $scope.order.items) {
        if ($scope.order.items[i] === item) {
          $scope.order.items.splice(i, 1);
        }
      }
    };

    $scope.calcArray = function (good) {
      var items = [];
      if (good) {
        items.push(good);
      }
      $scope.goods.forEach(function (g) {
        if (!_.find($scope.order.items, function (item) {
          return item.good && item.good._id === g._id;
        })) {
          items.push(g);
        }
      });
      return items;
    };

    $scope.disableSave = function () {
      // if ($scope.order.$promise) return false;
      if (!$scope.order || !$scope.order.items || $scope.order.items.length) return true;
      var disable = false;
      $scope.order.items.forEach(function (item) {
        if (!item.good || !item.count || item.count === 0 || item.count > item.good.count) {
          disable = true;
        }
      });

      return disable;
    };
  }
]);
