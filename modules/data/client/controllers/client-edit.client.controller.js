'use strict';

// Clients controller
angular.module('data').controller('ClientsEditController', [
  '$scope', '$stateParams', '$location', 'Authentication', 'Clients', 'Places', 'Orders', 't',
  function ($scope, $stateParams, $location, Authentication, Clients, Places, Orders, t) {
    $scope.t = t;
    $scope.authentication = Authentication;
    $scope.currentPage = 1;
    $scope.itemsPerPage = 20;

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');
        return false;
      }

      var client = $scope.client;

      if ($scope.client._id) {
        client.$update(function () {
          $location.path('clients');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        client.$save(function () {
          $location.path('clients');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.findOne = function () {
      Places.query(function (data) {
        $scope.places = data;
        if ($stateParams.clientId) {
          $scope.client = Clients.get({
            clientId: $stateParams.clientId
          });
          $scope.title = $scope.t.EDIT_CLIENT;
          $scope.updateList();
        }
        else {
          $scope.client = new Clients();
          $scope.title = $scope.t.ADD_CLIENT;
        }
      });
    };

    $scope.cancel = function () {
      $location.path('clients');
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
        client: $stateParams.clientId,
        // q: $scope.search
      }, function (data) {
        $scope.orders = data.orders;
        $scope.ordersCount = data.count;
      });
    };
  }
]);
