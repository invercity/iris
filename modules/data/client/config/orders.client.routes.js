'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('orders', {
        abstract: true,
        url: '/orders',
        template: '<ui-view/>'
      })
      .state('orders.list', {
        url: '',
        templateUrl: 'modules/data/client/views/orders/list.client.view.html'
      })
      .state('orders.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/orders/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('orders.view', {
        url: '/:orderId',
        templateUrl: 'modules/data/client/views/orders/view.client.view.html'
      })
      .state('orders.edit', {
        url: '/:orderId/edit',
        templateUrl: 'modules/data/client/views/orders/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
