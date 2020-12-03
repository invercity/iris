'use strict';

// Order controller
angular.module('data').controller('OrdersEditController', [
  '$scope', '$stateParams', '$location', '$q',
  'Authentication', 'Orders', 'Goods', 'Clients', 'Places', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, $q, Authentication, Orders, Goods, Clients, Places, Confirm, t) {
    $scope.t = t;
    $scope.authentication = Authentication;
    $scope.currency = $scope.t.UAH;
    $scope.currentPage = 1;
    $scope.itemsPerPage = 20;

    $scope.isSalesShown = false;

    $scope.$watch('order.client', function () {
      if ($scope.order && $scope.order.client && $scope.order.client.defaultPlace && !$scope.order.place) {
        $scope.order.place = $scope.order.client.defaultPlace;
      }
    });

    $scope.update = function (isValid, useOrder, callback) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'orderForm');
        return false;
      }

      var order = useOrder || $scope.order;
      order.total = $scope.calculateTotal(order);
      $scope.disableSaveBtn = true;

      if (order._id) {
        order.$update(function () {
          $scope.disableSaveBtn = false;
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.disableSaveBtn = false;
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        order.$save(function () {
          $scope.disableSaveBtn = false;
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.disableSaveBtn = false;
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.getClients = function (query) {
      return Clients.query({
        q: query
      }).$promise.then(function (data) { return data.items; });
    };

    $scope.getPlaces = function (query) {
      return Places.query({
        q: query
      }).$promise.then(function (data) { return data.items; });
    };

    $scope.getClientSearchValue = function (client) {
      if (!client || !client._id) {
        return '';
      }
      if (!client.name) {
        return client.firstName + ' ' + client.phone;
      }
      return client.name;
    };

    $scope.pay = function (isValid, order) {
      Confirm.show($scope.t.CONFIRM, $scope.t.PAY_ORDER_CONF, function () {
        // TODO: optimise this
        if (order._id) {
          order.payed = true;
          $scope.update(isValid, order);
        } else {
          Orders.get({
            orderId: order
          }, function (data) {
            data.payed = true;
            $scope.update(isValid, data);
          });
        }
      });
    };

    var calcArray = function (good) {
      // if (!$scope.goods) return [];
      var name = good ? good.name : '';
      return Goods.query({
        q: name
      }).$promise.then(function (data) {
        var items = [];
        if (good && good._id) {
          items.push(good);
        }
        data.items.forEach(function (g) {
          if (!_.find($scope.order.items, function (item) {
            return item.good && item.good._id === g._id;
          })) {
            if (g.count) {
              items.push(g);
            }
          }
        });
        return items;
      });
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
          /* Places.query({ q: data.client.firstName }, function (data) {
            $scope.clients = data.items;
          }); */
        });
      }
      else {
        $scope.order = new Orders();
        $scope.title = $scope.t.NEW_ORDER;
        $scope.order.status = $scope.statuses[0].value;
        $scope.calcArray = calcArray;
      }
      /* Clients.query(function (data) {
          $scope.clients = data.items;
          $scope.order = new Orders();
          $scope.title = $scope.t.NEW_ORDER;
          $scope.order.status = $scope.statuses[0].value;
          $scope.calcArray = calcArray;
        });
      }

      Goods.query(function (data) {
        $scope.goods = data.items;
      });
      Places.query(function (data) {
        $scope.places = data.items;
        $scope.places.unshift({
          name: $scope.t.EDIT_MANUALLY
        });
      }); */
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
      var totalPrice = Math.max(0, total);
      if (order.extra) {
        return (totalPrice * (1 + order.extra/100)).toFixed(2);
      }
      return totalPrice.toFixed(2);
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
      if (!$scope.order || !$scope.order.items || !$scope.order.items.length || $scope.disableSaveBtn) return true;
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

    function toZero(val) {
      return Math.max(0, val);
    }
  }
]);
