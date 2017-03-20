'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('places', {
        abstract: true,
        url: '/places',
        template: '<ui-view/>'
      })
      .state('places.list', {
        url: '',
        templateUrl: 'modules/data/client/views/places/list.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('places.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/places/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('places.edit', {
        url: '/:placeId/edit',
        templateUrl: 'modules/data/client/views/places/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);
