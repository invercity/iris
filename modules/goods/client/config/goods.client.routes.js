'use strict';

// Setting up route
angular.module('goods').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('goods', {
        abstract: true,
        url: '/goods',
        template: '<ui-view/>'
      })
      .state('goods.list', {
        url: '',
        templateUrl: 'modules/goods/client/views/list.client.view.html'
      })
      .state('goods.create', {
        url: '/create',
        templateUrl: 'modules/goods/client/views/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('goods.view', {
        url: '/:goodId',
        templateUrl: 'modules/goods/client/views/view.client.view.html'
      })
      .state('goods.edit', {
        url: '/:goodId/edit',
        templateUrl: 'modules/goods/client/views/edit.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
