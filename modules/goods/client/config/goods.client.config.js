'use strict';

// Configuring the Articles module
angular.module('goods').run(['Menus',
  function (Menus) {
    // Add the articles dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Товары',
      state: 'goods.list',
      roles: ['*']
    });
  }
]);
