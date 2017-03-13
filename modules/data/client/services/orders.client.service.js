'use strict';

angular.module('data').factory('Orders', ['$resource',
  function ($resource) {
    return $resource('api/orders/:orderId', {
      orderId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
