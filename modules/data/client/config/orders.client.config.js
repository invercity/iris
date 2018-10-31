'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    // Add the orders dropdown item
    Menus.addMenuItem('topbar', {
      title: t.MENU_ORDERS,
      state: 'orders.list',
      roles: ['admin'],
      position: 0
    });
  }
]);
