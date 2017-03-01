'use strict';

angular.module('data').factory('Goods', ['$resource',
  function ($resource) {
    return $resource('api/goods/:goodId', {
      goodId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
