'use strict';

angular.module('data').factory('Places', ['$resource',
  function ($resource) {
    return $resource('api/places/:placeId', {
      placeId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      query: {
        method: 'GET', isArray:false
      }
    });
  }
]);
