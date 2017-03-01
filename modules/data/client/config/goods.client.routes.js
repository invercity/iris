'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('goods', {
        abstract: true,
        url: '/goods',
        template: '<ui-view/>'
      })
      .state('goods.list', {
        url: '',
        templateUrl: 'modules/data/client/views/list.client.view.html'
      })
      .state('goods.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('goods.view', {
        url: '/:goodId',
        templateUrl: 'modules/data/client/views/view.client.view.html'
      })
      .state('goods.edit', {
        url: '/:goodId/edit',
        templateUrl: 'modules/data/client/views/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
