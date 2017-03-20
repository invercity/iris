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
        templateUrl: 'modules/data/client/views/goods/list.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('goods.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/goods/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('goods.edit', {
        url: '/:goodId/edit',
        templateUrl: 'modules/data/client/views/goods/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);
