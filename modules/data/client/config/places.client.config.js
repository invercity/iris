'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    Menus.addMenuItem('topbar', {
      title: t.MENU_PLACES,
      state: 'places.list',
      roles: ['admin'],
      position: 3
    });
  }
]);
