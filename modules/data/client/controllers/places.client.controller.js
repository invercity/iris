'use strict';

// Places controller
angular.module('data').controller('PlacesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Places', 't',
  function ($scope, $stateParams, $location, Authentication, Places, t) {
    $scope.t = t;
    $scope.authentication = Authentication;

    $scope.remove = function (place) {
      if (place) {
        place.$remove();

        for (var i in $scope.places) {
          if ($scope.places[i] === place) {
            $scope.places.splice(i, 1);
          }
        }
      } else {
        $scope.place.$remove(function () {
          $location.path('goods');
        });
      }
    };

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      var place = $scope.place;

      if ($scope.place._id) {
        place.$update(function () {
          $location.path('places');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        place.$save(function () {
          $location.path('places');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.find = function () {
      // TODO: implement pagination component
      Places.query({
        limit: 999
      }, function (data) {
        $scope.places = data.items;
      });
    };

    $scope.findOne = function () {
      if ($stateParams.placeId) {
        $scope.place = Places.get({
          placeId: $stateParams.placeId
        });
        $scope.title = $scope.t.EDIT_PLACE;
      }
      else {
        $scope.place = new Places();
        $scope.title = $scope.t.NEW_PLACE;
      }
    };

    $scope.cancel = function () {
      $location.path('places');
    };
  }
]);
