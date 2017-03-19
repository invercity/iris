'use strict';

angular.module('data').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Места',
      state: 'places.list',
      roles: ['*']
    });
  }
]);
