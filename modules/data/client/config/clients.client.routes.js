'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('clients', {
        abstract: true,
        url: '/clients',
        template: '<ui-view/>'
      })
      .state('clients.list', {
        url: '',
        templateUrl: 'modules/data/client/views/clients/list.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('clients.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/clients/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('clients.edit', {
        url: '/:clientId/edit',
        templateUrl: 'modules/data/client/views/clients/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);
