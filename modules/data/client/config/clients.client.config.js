'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    // Add the clients dropdown item
    Menus.addMenuItem('topbar', {
      // TODO
      title: 'Клієнти',
      state: 'clients.list',
      roles: ['user'],
      position: 2
    });
  }
]);
