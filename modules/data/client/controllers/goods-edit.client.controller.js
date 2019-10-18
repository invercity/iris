'use strict';

// Goods controller
angular.module('data').controller('GoodsEditController',
  ['$scope', '$stateParams', '$location', 'Authentication', 'Goods', 'Orders', 'ConfirmService', 't',
    function ($scope, $stateParams, $location, Authentication, Goods, Orders, Confirm, t) {
      $scope.t = t;
      $scope.authentication = Authentication;
      $scope.currentPage = 1;
      $scope.itemsPerPage = 20;
      $scope.reportDate = new Date().toLocaleDateString();

      $scope.getReport = function() {
        domtoimage.toBlob(document.getElementById('report'))
          .then(function (blob) {
            window.saveAs(blob, 'Звіт за ' + new Date().toLocaleDateString() + ' по товару "' + $scope.good.name + '" .png');
          });
      };

      $scope.update = function (isValid) {
        $scope.error = null;

        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'articleForm');

          return false;
        }

        var good = $scope.good;

        if (good._id) {
          good.$update(function () {
            $location.path('goods');
          }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
          });
        }

        else {
          good.$save(function () {
            $location.path('goods');
          }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
          });
        }
      };

      $scope.findOne = function () {
        if ($stateParams.goodId) {
          $scope.good = Goods.get({
            goodId: $stateParams.goodId
          });
          $scope.title = $scope.t.GOOD_EDIT;
          $scope.updateList();
        }
        else {
          $scope.good = new Goods({
            price: 1,
            count: 0,
            type: $scope.types[2].value
          });
          $scope.title = $scope.t.GOOD_NEW;
        }
      };

      $scope.types = [
        {
          name: 'Унісекс',
          value: 'uni'
        },
        {
          name: 'Чоловічий',
          value: 'm'
        },
        {
          name: 'Жіночий',
          value: 'w'
        }
      ];

      $scope.cancel = function () {
        $location.path('goods');
      };

      $scope.add = function (good) {
        Confirm.showValue({
          title: $scope.t.GOOD_ADD,
          text: $scope.t.GOOD_ENTER_COUNT,
          value: true
        }, function (count) {
          good.count += count;
          good.$update();
        });
      };

      $scope.updateList = function () {
        // var place = $scope.selectedPlace ? $scope.selectedPlace._id : undefined;
        // var status = $scope.selectedStatus ? $scope.selectedStatus.value : undefined;
        // var payed = _.get($scope.selectedType, 'payed');
        // var good = $scope.selectedGood ? $scope.selectedGood._id : undefined;
        $scope.ordersResolved = Orders.query({
          // payed: payed,
          // place: place,
          // status: status,
          page: $scope.currentPage,
          limit: $scope.itemsPerPage,
          good: $stateParams.goodId,
          sort: 'client.firstName'
          // q: $scope.search
        }, function (data) {
          $scope.orders = data.orders;
          $scope.ordersCount = data.count;
        });
      };

      $scope.pay = function (order) {
        Confirm.show($scope.t.CONFIRM, $scope.t.PAY_ORDER_CONF, function () {
          order.payed = true;
          Orders.update(order);
          $scope.filterOrders();
        });
      };

      $scope.send = function (order) {
        Confirm.show($scope.t.CONFIRM, $scope.t.SEND_ORDER_CONF, function () {
          order.status = 'sent';
          Orders.update(order);
          $scope.filterOrders();
        });
      };

      $scope.filterOrders = function () {
        $scope.orders = _.filter($scope.orders, function (order) {
          return !order.payed && order.status !== 'sent';
        });
      };

      $scope.isOrderSend = function (order) {
        return order.status === 'sent';
      };

      $scope.isOrderPayed = function (order) {
        return !$scope.isOrderSend(order) && order.payed;
      };
    }
  ]);
