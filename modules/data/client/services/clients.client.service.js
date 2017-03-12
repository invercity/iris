'use strict';

angular.module('data').factory('Clients', ['$resource',
  function ($resource) {
    return $resource('api/clients/:clientId', {
      clientId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
