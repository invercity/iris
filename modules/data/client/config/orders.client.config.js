'use strict';

angular.module('data').run(['Menus',
  function (Menus) {
    // Add the articles dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Заказы',
      state: 'orders.list',
      roles: ['admin']
    });
  }
]);
