'use strict';

// Order controller
angular.module('data').controller('OrdersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Orders', 'Goods', 'Clients', 'ConfirmService',
  function ($scope, $stateParams, $location, Authentication, Orders, Goods, Clients, Confirm) {

    $scope.authentication = Authentication;
    $scope.currency = ' UAH';

    var toZero = function (val) {
      return val < 0 ? 0 : val;
    };

    $scope.orderTypes = [
      {
        name: 'Новые',
        payed: false,
        active: true
      },
      {
        name: 'Оплаченные',
        payed: true,
        active: false
      },
      {
        name: 'Все',
        payed: undefined,
        active: false
      }
    ];

    $scope.changeType = function (type) {
      if ($scope.selectedType) {
        $scope.selectedType.active = false;
      }
      $scope.selectedType = type;
      $scope.selectedType.active = true;
      $scope.orders = Orders.query({
        payed: type.payed
      }, function () {
        $scope.buildPager();
      });
    };

    $scope.remove = function (order) {
      if (order) {
        Confirm.show('Подтверждение', 'Удалить данный заказ?', function () {
          order.$remove();

          for (var i in $scope.orders) {
            if ($scope.orders[i] === order) {
              $scope.orders.splice(i, 1);
            }
          }
          $scope.buildPager();
        });
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

    $scope.pay = function () {
      Confirm.show('Подтверждение', 'Оплатить данный заказ?', function () {
        $scope.order.payed = true;
        $scope.update(true);
      });
    };

    $scope.find = function () {
      $scope.changeType($scope.orderTypes[0]);
    };

    var calcArray = function (good) {
      if (!$scope.goods) return [];
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

    $scope.findOne = function () {
      if ($stateParams.orderId) {
        Orders.get({
          orderId: $stateParams.orderId
        }, function (data) {
          $scope.order = data;
          $scope.calcArray = calcArray;
          $scope.savedOrder = _.cloneDeep(data);
          $scope.title = 'Редактирование заказа #' + data.code;
        });
      }
      else {
        $scope.order = new Orders();
        $scope.title = 'Новый заказ';
        $scope.order.client = 0;
        $scope.calcArray = calcArray;
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
      var availableGoods = calcArray();
      if (availableGoods.length) {
        defaultItem.good = availableGoods[0];
      }
      if (!$scope.order.items) {
        $scope.order.items = [];
      }

      $scope.order.items.push(defaultItem);
    };

    $scope.calculateTotal = function (order) {
      if (!order || !order.items) return;
      var total = 0;
      for (var i=0;i<order.items.length;i++) {
        var item = order.items[i];
        if (item.good && item.good.price && item.count) {
          total += (item.good.price * item.count);
        }
      }
      return total.toFixed(2) + $scope.currency;
    };

    $scope.calculateLeft = function (good) {
      var items = $scope.order.items;
      if (!good || !items) {
        return;
      }
      var item = _.find(items, function (i) {
        return i.good._id === good._id;
      });
      var savedItem = $scope.savedOrder ? _.find($scope.savedOrder.items, function (i) {
        return good._id === i.good._id;
      }) : null;
      if (!item) {
        if (savedItem) {
          return good.count + savedItem.count;
        }
        return good.count;
      }
      var newItemCount = good.count - item.count;
      if (!savedItem) {
        return toZero(newItemCount);
      }
      return toZero(savedItem.count + newItemCount);
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

    $scope.disableSave = function () {
      if (!$scope.order || !$scope.order.items || !$scope.order.items.length) return true;
      var disable = false;
      var findSelectedOrder = function (item) {
        return function (i) {
          return i.good._id === item.good._id;
        };
      };
      $scope.order.items.forEach(function (item) {
        var saved = $scope.savedOrder ? _.find($scope.savedOrder.items, findSelectedOrder(item)) : undefined;
        if (!item.count || item.count === 0 || (item.count > item.good.count && !saved) || (saved && item.count - saved.count > item.good.count)) {
          disable = true;
        }
      });

      return disable;
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = _.filter($scope.orders, function (order) {
        if (!$scope.search) return true;
        var fields = [
          'client.firstName',
          'client.lastName',
          'client.phone',
          'code'
        ];
        return _.some(fields, function (field) {
          var value = _.get(order, field);
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
