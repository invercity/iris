'use strict';

// Order controller
angular.module('data').controller('OrdersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Orders', 'Goods', 'Clients', 'Places', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, Authentication, Orders, Goods, Clients, Places, Confirm, t) {

    $scope.t = t;
    $scope.authentication = Authentication;
    $scope.currency = ' ' + $scope.t.UAH;

    var toZero = function (val) {
      return val < 0 ? 0 : val;
    };

    $scope.orderTypes = [
      {
        name: $scope.t.ORDER_TYPE_NEW,
        payed: false,
        active: true
      },
      {
        name: $scope.t.ORDER_TYPE_PAYED,
        payed: true,
        active: false
      },
      {
        name: $scope.t.ORDER_TYPE_ALL,
        payed: undefined,
        active: false
      }
    ];

    $scope.statuses = [
      {
        name: $scope.t.ORDER_STATUS_NEW,
        value: 'work',
      },
      {
        name: $scope.t.ORDER_STATUS_READY,
        value: 'ready'
      },
      {
        name: $scope.t.ORDER_STATUS_TOGO,
        value: 'togo'
      },
      {
        name: $scope.t.ORDER_STATUS_DONE,
        value: 'done'
      },
    ];

    $scope.listStatuses = $scope.statuses.concat({
      name: $scope.t.ORDER_TYPE_ALL,
    });

    $scope.changeType = function (type) {
      if ($scope.selectedType) {
        $scope.selectedType.active = false;
      }
      $scope.selectedType = type;
      $scope.selectedType.active = true;
      var place = $scope.selectedPlace ? $scope.selectedPlace._id : undefined;
      var status = $scope.selectedStatus ? $scope.selectedStatus.value : undefined;
      $scope.orders = Orders.query({
        payed: type.payed,
        place: place,
        status: status,
      }, function () {
        $scope.buildPager();
      });
    };

    $scope.$watch('selectedPlace', function () {
      if ($scope.selectedType) {
        $scope.changeType($scope.selectedType);
      }
    });

    $scope.$watch('selectedStatus', function () {
      if ($scope.selectedType) {
        $scope.changeType($scope.selectedType);
      }
    });

    $scope.remove = function (order) {
      if (order) {
        Confirm.show($scope.t.CONFIRM, $scope.t.REMOVE_ORDER_CONF, function () {
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

    $scope.update = function (isValid, useOrder, callback) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'orderForm');

        return false;
      }

      var order = useOrder || $scope.order;

      if (order._id) {
        order.$update(function () {
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        order.$save(function () {
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.pay = function (isValid, order, update) {
      Confirm.show($scope.t.CONFIRM, $scope.t.PAY_ORDER_CONF, function () {
        order.payed = true;
        $scope.update(isValid, order, function () {
          if (update) {
            $scope.changeType($scope.selectedType);
          }
        });
      });
    };

    $scope.find = function () {
      $scope.changeType($scope.orderTypes[0]);
      Places.query(function (data) {
        $scope.places = data;
        $scope.places.unshift({
          name: 'Все'
        });
        $scope.selectedStatus = $scope.listStatuses[4];
        $scope.selectedPlace = $scope.places[0];
      });
    };

    var calcArray = function (good) {
      if (!$scope.goods) return [];
      var items = [];
      if (good && good._id) {
        items.push(good);
      }
      $scope.goods.forEach(function (g) {
        if (!_.find($scope.order.items, function (item) {
          return item.good && item.good._id === g._id;
        })) {
          if (g.count) {
            items.push(g);
          }
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
          $scope.title = $scope.t.EDIT_ORDER_NUM + data.code;
          $scope.order.link = 'https://vitaly.herokuapp.com/orders/' + data._id;
          if (!$scope.order.status) {
            $scope.order.status = $scope.statuses[0].value;
          }
        });
      }
      else {
        $scope.order = new Orders();
        $scope.title = $scope.t.NEW_ORDER;
        $scope.order.client = 0;
        $scope.order.status = $scope.statuses[0].value;
        $scope.calcArray = calcArray;
      }

      $scope.goods = Goods.query();
      $scope.clients = Clients.query();
      Places.query(function (data) {
        $scope.places = data;
        $scope.places.unshift({
          name: $scope.t.EDIT_MANUALLY
        });
      });
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
      if (order.sale) {
        total -= order.sale;
      }
      if (order.credit) {
        total += order.credit;
      }
      return Math.max(0, total.toFixed(2)) + $scope.currency;
    };

    $scope.calculateLeft = function (good) {
      var items = $scope.order.items;
      if (!good || !items || !good._id) {
        return;
      }
      var item = _.find(items, function (i) {
        // TODO: temporary realization
        if (!i.good || !good) {
          return false;
        }
        return i.good._id === good._id;
      });
      var savedItem = $scope.savedOrder ? _.find($scope.savedOrder.items, function (i) {
        // TODO: temporary realization
        if (!i.good || !good) {
          return false;
        }
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
          // TODO: temporary realization
          if (!i.good || !item.good) return false;
          return i.good._id === item.good._id;
        };
      };
      $scope.order.items.forEach(function (item) {
        var saved = $scope.savedOrder ? _.find($scope.savedOrder.items, findSelectedOrder(item)) : undefined;
        if (!item.count || item.count === 0 || (!item.good) || (!item.good._id) || (item.count > item.good.count && !saved) || (saved && item.count - saved.count > item.good.count)) {
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
