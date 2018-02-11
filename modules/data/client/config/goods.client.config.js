'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    // Add the articles dropdown item
    Menus.addMenuItem('topbar', {
      title: t.MENU_GOODS,
      state: 'goods.list',
      roles: ['user']
    });
  }
]);
