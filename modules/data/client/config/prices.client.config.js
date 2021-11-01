'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    Menus.addMenuItem('topbar', {
      title: t.MENU_PRICES,
      state: 'prices.view',
      roles: ['*'],
      position: -1
    });
  }
]);
