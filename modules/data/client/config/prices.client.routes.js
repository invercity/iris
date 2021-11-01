'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('prices', {
        abstract: true,
        url: '/prices',
        template: '<ui-view/>'
      })
      .state('prices.view', {
        url: '',
        templateUrl: 'modules/data/client/views/prices/view.client.view.html',
        data: {
          roles: ['*']
        }
      });
  }
]);