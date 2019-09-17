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
    // create separate order for each good
    $scope.separate = true;

    $scope.isSalesShown = false;

    $scope.$watch('order.client', function () {
      if ($scope.order && $scope.order.client && $scope.order.client.defaultPlace && !$scope.order.place) {
        $scope.order.place = $scope.order.client.defaultPlace;
      }
    });

    $scope.$watch('flacon', function () {
      if ($scope.order) {
        var extraIndex = _.findIndex($scope.order.extras, function (extra) { return extra.type === 'flacon'; });
        if ($scope.flacon) {
          if (extraIndex === -1) {
            $scope.order.extras.push({ type: 'flacon', value: 20 });
            $scope.calculateTotal($scope.order);
          }
        } else {
          if (extraIndex !== -1) {
            $scope.order.extras.splice(extraIndex, extraIndex + 1);
            $scope.calculateTotal($scope.order);
          }
        }
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
        var deferred = $q.defer().resolve();
        deferred.resolve();
        deferred
          .promise
          .then((function () {
            if ($scope.separate && $scope.order.items.length > 1) {
              var orders = _.map($scope.order.items, function (item) {
                var orderClone = _.clone($scope.order);
                orderClone.items = [item];
                return orderClone;
              });
              return $q.all(_.map(orders, function (order) {
                return Orders.save(order).$promise;
              }));
            }
            else {
              return order.$save();
            }
          }))
          .then(function () {
            $scope.disableSaveBtn = false;
            if ($stateParams.clientId) {
              $location.path('clients/' + $stateParams.clientId + '/edit');
            } else {
              $location.path('orders');
            }
            if (callback) {
              callback();
            }
          })
          .catch(function(err) {
            $scope.disableSaveBtn = false;
            $scope.error = err.data.message;
          });
      }
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
          $scope.flacon = !!(data.extras && _.find(data.extras, function (e) { return e.type === 'flacon'; }));
          $scope.calcArray = calcArray;
          $scope.savedOrder = _.cloneDeep(data);
          $scope.title = $scope.t.EDIT_ORDER_NUM + data.code;
          $scope.order.link = 'https://maryna-cn.herokuapp.com/orders/' + data._id;
          if (!$scope.order.status) {
            $scope.order.status = $scope.statuses[0].value;
          }
        });
      }
      else {
        Clients.query(function (data) {
          $scope.clients = data;
          $scope.order = new Orders();
          $scope.title = $scope.t.NEW_ORDER;
          $scope.order.status = $scope.statuses[0].value;
          $scope.calcArray = calcArray;
          if ($stateParams.clientId) {
            $scope.order.client = _.find($scope.clients, function (client) {
              return client._id === $stateParams.clientId;
            });
          }
        });
      }

      Goods.query(function (data) {
        $scope.goods = data.items;
      });
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
      if (order.extras) {
        _.each(order.extras, function (e) {
          total += e.value;
        });
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
        name: $scope.t.ORDER_STATUS_SENT,
        value: 'sent'
      },
      {
        name: $scope.t.ORDER_STATUS_CARE,
        value: 'care'
      },
      {
        name: $scope.t.ORDER_STATUS_OUT,
        value: 'out'
      },
      {
        name: $scope.t.ORDER_STATUS_SELF,
        value: 'self'
      }
    ];

    function toZero(val) {
      return Math.max(0, val);
    }
  }
]);
