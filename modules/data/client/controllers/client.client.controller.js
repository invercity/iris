'use strict';

// Clients controller
angular.module('data').controller('ClientsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Clients', 'Places', 't',
  function ($scope, $stateParams, $location, Authentication, Clients, Places, t) {
    $scope.t = t;
    $scope.authentication = Authentication;

    $scope.remove = function (client) {
      if (client) {
        client.$remove();

        for (var i in $scope.clients) {
          if ($scope.clients[i] === client) {
            $scope.clients.splice(i, 1);
          }
        }
      } else {
        $scope.client.$remove(function () {
          $location.path('clients');
        });
      }
    };

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

    $scope.find = function () {
      Clients.query(function (data) {
        $scope.clients = data.items;
        $scope.buildPager();
      });
    };

    $scope.findOne = function () {
      Places.query(function (data) {
        $scope.places = data;
        if ($stateParams.clientId) {
          $scope.client = Clients.get({
            clientId: $stateParams.clientId
          });
          $scope.title = $scope.t.EDIT_CLIENT;
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

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = _.filter($scope.clients, function (client) {
        if (!$scope.search) return true;
        var fields = [
          'firstName',
          'phone'
        ];
        return _.some(fields, function (field) {
          var value = _.get(client, field);
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
