'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'iris';
  var applicationModuleVendorDependencies = [
    'ngResource',
    'ngAnimate',
    'ngMessages',
    'ui.router',
    'ui.bootstrap',
    'ui.utils',
    'angularFileUpload'
  ];

  // Add a new vertical module
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
  function ($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }
]);

angular.module(ApplicationConfiguration.applicationModuleName).run(["$rootScope", "$state", "Authentication", function ($rootScope, $state, Authentication) {

  // Check authentication before changing state
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
      var allowed = false;
      toState.data.roles.forEach(function (role) {
        if (Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(role) !== -1) {
          allowed = true;
          return true;
        }
      });

      if (!allowed) {
        event.preventDefault();
        if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
          $state.go('forbidden');
        } else {
          $state.go('authentication.signin').then(function () {
            storePreviousState(toState, toParams);
          });
        }
      }
    }
  });

  // Record previous state
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    storePreviousState(fromState, fromParams);
  });

  // Store previous state
  function storePreviousState(state, params) {
    // only store this state if it shouldn't be ignored 
    if (!state.data || !state.data.ignoreState) {
      $state.previous = {
        state: state,
        params: params,
        href: $state.href(state, params)
      };
    }
  }
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash && window.location.hash === '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState('', document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
ApplicationConfiguration.registerModule('core.admin', ['core']);
ApplicationConfiguration.registerModule('core.admin.routes', ['ui.router']);

'use strict';

ApplicationConfiguration.registerModule('data');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users', ['core']);
ApplicationConfiguration.registerModule('users.admin', ['core.admin']);
ApplicationConfiguration.registerModule('users.admin.routes', ['core.admin.routes']);

'use strict';

// Setting up route
angular.module('core.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
]);

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'modules/core/client/views/home.client.view.html',
      data: {
        roles: ['admin']
      }
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
]);

'use strict';

angular.module('core').controller('ConfirmController', ["$scope", "$modalInstance", "data", "t", function ($scope, $modalInstance, data, t) {

  $scope.t = t;

  $scope.confirmText = data.confirmText;
  $scope.confirmTitle = data.confirmTitle;
  $scope.confirmValue = data.confirmValue;

  $scope.state = {
    value: 1
  };

  $scope.ok = function () {
    $modalInstance.close($scope.state.value);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus', 't',
  function ($scope, $state, Authentication, Menus, t) {
    $scope.t = t;
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);

'use strict';

angular.module('core').controller('HomeController', ['$scope', '$q', 'Authentication', 'Goods', 'Orders', 't',
  function ($scope, $q, Authentication, Goods, Orders, t) {
    $scope.t = t;
    // This provides Authentication context.
    $scope.authentication = Authentication;

    var goodsData = Goods.query();
    var ordersData = Orders.query();

    $q.all([goodsData.$promise, ordersData.$promise])
      .then(function () {
        $scope.tabs = [
          {
            icon: 'shopping-cart',
            title: $scope.t.ORDERS_LIST,
            state: 'orders.list',
            actionTitle: $scope.t.ADD,
            actionState: 'orders.create',
            actionIcon: 'plus',
            count: ordersData.count,
          },
          {
            icon: 'apple',
            title: t.GOODS,
            state: 'goods.list',
            actionTitle: t.ADD,
            actionState: 'goods.create',
            actionIcon: 'plus',
            count: goodsData.length,
          },
        ];
      });
  }
]);

'use strict';

/**
 * Edits by Ryan Hutchison
 * Credit: https://github.com/paulyoder/angular-bootstrap-show-errors */

angular.module('core')
  .directive('showErrors', ['$timeout', '$interpolate', function ($timeout, $interpolate) {
    var linkFn = function (scope, el, attrs, formCtrl) {
      var inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses,
        initCheck = false,
        showValidationMessages = false,
        blurred = false;

      options = scope.$eval(attrs.showErrors) || {};
      showSuccess = options.showSuccess || false;
      inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
      inputNgEl = angular.element(inputEl);
      inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

      if (!inputName) {
        throw 'show-errors element has no child input elements with a \'name\' attribute class';
      }

      var reset = function () {
        return $timeout(function () {
          el.removeClass('has-error');
          el.removeClass('has-success');
          showValidationMessages = false;
        }, 0, false);
      };

      scope.$watch(function () {
        return formCtrl[inputName] && formCtrl[inputName].$invalid;
      }, function (invalid) {
        return toggleClasses(invalid);
      });

      scope.$on('show-errors-check-validity', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          initCheck = true;
          showValidationMessages = true;

          return toggleClasses(formCtrl[inputName].$invalid);
        }
      });

      scope.$on('show-errors-reset', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          return reset();
        }
      });

      toggleClasses = function (invalid) {
        el.toggleClass('has-error', showValidationMessages && invalid);
        if (showSuccess) {
          return el.toggleClass('has-success', showValidationMessages && !invalid);
        }
      };
    };

    return {
      restrict: 'A',
      require: '^form',
      compile: function (elem, attrs) {
        if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
          if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
            throw 'show-errors element does not have the \'form-group\' or \'input-group\' class';
          }
        }
        return linkFn;
      }
    };
  }]);

'use strict';

angular.module('core').factory('ConfirmService', ['$modal', function ($modal) {
  return {
    showValue: function (data, confirm, decline) {
      var title = data.title;
      var text = data.text;
      var value = data.value;
      var modalInstance = $modal.open({
        animation: true,
        templateUrl: 'modules/core/client/views/confirm.client.view.html',
        controller: 'ConfirmController',
        resolve: {
          data: {
            confirmText: text,
            confirmTitle: title,
            confirmValue: value,
          }
        }
      });

      modalInstance.result.then(function (is) {
        if (confirm && is) {
          confirm(is);
        }
      }, function () {
        if (decline) {
          decline();
        }
      });
    },
    show: function (title, text, confirm, decline) {
      this.showValue({
        title: title,
        text: text
      }, confirm, decline);
    }
  };
}]);
'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector',
  function ($q, $injector) {
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              $injector.get('$state').transitionTo('authentication.signin');
              break;
            case 403:
              $injector.get('$state').transitionTo('forbidden');
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [
  function () {
    // Define a set of default roles
    this.defaultRoles = ['user', 'admin'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function (user) {
      if (!!~this.roles.indexOf('*')) {
        return true;
      } else {
        if(!user) {
          return false;
        }
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function (menuId, options) {
      options = options || {};

      // Create the new menu
      this.menus[menuId] = {
        roles: options.roles || this.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function (menuId, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          this.addSubMenuItem(menuId, options.state, options.items[i]);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function (menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === menuItemState) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar', {
      roles: ['*']
    });
  }
]);

'use strict';

angular.module('core').factory('t', [function () {
  return {
    ERR: 'Помилка',
    UAH: '₴',
    MENU_ADMIN: 'Адмініcтрування',
    MENU_ENTER: 'Вхід',
    MENU_EDIT_PROFILE: 'Редагування профілю',
    MENU_CHANGE_PWD: 'Змінити пароль',
    MENU_EXIT: 'Вихід',
    MENU_GOODS: 'Товари',
    MENU_PLACES: 'Місця',
    MENU_ORDERS: 'Замовлення',
    ENTER_COUNT: 'Введіть кількість',
    GOOD_EDIT: 'Редагувати товар',
    GOOD_NEW: 'Створити товар',
    GOOD_ADD: 'Додати товар',
    GOOD_ENTER_COUNT: 'Введіть кількість:',
    ORDER_TYPE_NEW: 'Нові',
    ORDER_TYPE_PAYED: 'Оплачені',
    ORDER_TYPE_ALL: 'Всі',
    ORDER_STATUS_NEW: 'Нові',
    ORDER_STATUS_READY: 'Готові',
    ORDER_STATUS_TOGO: 'Можна збирати',
    ORDER_STATUS_DONE: 'Зібрані',
    OK: 'Так',
    CANCEL: 'Відмінити',
    CONFIRM: 'Підтвердження',
    REMOVE_ORDER_CONF: 'Видалити дане замовлення?',
    PAY_ORDER_CONF: 'Оплатити дане замовлення?',
    EDIT_ORDER_NUM: 'Редагувати замовлення #',
    NEW_ORDER: 'Нове замовлення',
    EDIT_MANUALLY: 'Ввести вручну',
    EDIT_PLACE: 'Редагування місця видачі',
    NEW_PLACE: 'Нове місце видачі',
    NAME: 'Назва',
    P_NAME: 'Ім\'я',
    REQUIRED: 'обов\'язково.',
    DESC: 'Деталі',
    PRICE: 'Ціна',
    COUNT: 'Кількість',
    TYPE: 'Тип',
    SAVE: 'Зберегти',
    GOODS: 'Товари',
    ORDERS: 'Списки',
    ORDERS_LIST: 'Замовлення',
    SEARCH: 'Пошук',
    LINK_TO_ORDER: 'Посилання на замовлення',
    CLIENT_SELECT_CREATE: 'Клієнт (створити нового якщо не вибрано)',
    CLIENT: 'Клієнт',
    STATUS: 'Статус',
    SELECT_NAME: 'Введіть ім\'я або виберіть зі списку',
    SELECT_PLACE: 'Введіть місце або виберіть зі списку',
    SURNAME: 'Прізвище',
    PHONE: 'Телефон',
    PLACE_DELIVER: 'Місце видачі',
    ADDRESS: 'Адреса',
    LEFT: 'Залишок',
    TOTAL: 'Сума',
    SALE: 'Знижка',
    DEBT: 'Борг',
    TO_PAY: 'Оплатити',
    TOTAL_PRICE: 'Загальна сума:',
    ORDER_TYPES: 'Типи замовлень',
    ORDER_STATUS: 'Статус замовлень',
    ORDER_NUM: 'Замовлення #',
    CLIENT_LAB: 'Клієнт: ',
    IS_PAYED: 'Оплачений',
    IS_NOT_PAYED: 'Не оплачений',
    GOODS_LIST: 'Список товарів:',
    GOOD: 'Товар',
    TOTAL_PAY: 'Сума до сплати: ',
    ADDITIONAL: 'Додатково %',
    ADD: 'Додати',
    CREATED: 'Створений',
    ENTER_KEY_FOR_SEARCH: 'Введіть ключ для пошуку',
    AUTH: 'Авторизація',
    LOGIN: 'Логін',
    PASS: 'Пароль',
    P_FIRST: '<<',
    P_LAST: '>>',
    P_PREV: '<',
    P_NEXT: '>',
    ADDED: 'Доданий',
    ITEMS_LEFT: 'Залишилося'
  };
}]);

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

'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('goods', {
        abstract: true,
        url: '/goods',
        template: '<ui-view/>'
      })
      .state('goods.list', {
        url: '',
        templateUrl: 'modules/data/client/views/goods/list.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('goods.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/goods/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('goods.edit', {
        url: '/:goodId/edit',
        templateUrl: 'modules/data/client/views/goods/edit.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);

'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    // Add the articles dropdown item
    Menus.addMenuItem('topbar', {
      title: t.MENU_ORDERS,
      state: 'orders.list',
      roles: ['admin']
    });
  }
]);

'use strict';

// Setting up route
angular.module('data').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('orders', {
        abstract: true,
        url: '/orders',
        template: '<ui-view/>'
      })
      .state('orders.list', {
        url: '',
        templateUrl: 'modules/data/client/views/orders/list.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('orders.create', {
        url: '/create',
        templateUrl: 'modules/data/client/views/orders/edit.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('orders.view', {
        url: '/:orderId',
        templateUrl: 'modules/data/client/views/orders/view.client.view.html'
      })
      .state('orders.edit', {
        url: '/:orderId/edit',
        templateUrl: 'modules/data/client/views/orders/edit.client.view.html',
        data: {
          roles: ['user']
        }
      });
  }
]);

'use strict';

angular.module('data').run(['Menus', 't',
  function (Menus, t) {
    Menus.addMenuItem('topbar', {
      title: t.MENU_PLACES,
      state: 'places.list',
      roles: ['admin']
    });
  }
]);

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

'use strict';

// Goods controller
angular.module('data').controller('GoodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Goods', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, Authentication, Goods, Confirm, t) {
    $scope.t = t;
    $scope.authentication = Authentication;

    $scope.remove = function (good) {
      if (good) {
        good.$remove();

        for (var i in $scope.goods) {
          if ($scope.goods[i] === good) {
            $scope.goods.splice(i, 1);
          }
        }
      } else {
        $scope.good.$remove(function () {
          $location.path('goods');
        });
      }
    };

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      var good = $scope.good;

      if (good._id) {
        good.$update(function () {
          $location.path('goods');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        good.$save(function () {
          $location.path('goods');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.find = function () {
      Goods.query(function (data) {
        $scope.goods = data;
        $scope.buildPager();
      });
    };

    $scope.findOne = function () {
      if ($stateParams.goodId) {
        $scope.good = Goods.get({
          goodId: $stateParams.goodId
        });
        $scope.title = $scope.t.GOOD_EDIT;
      }
      else {
        $scope.good = new Goods({
          price: 1,
          count: 0
        });
        $scope.title = $scope.t.GOOD_NEW;
      }
    };

    $scope.cancel = function () {
      $location.path('goods');
    };

    $scope.add = function (good) {
      Confirm.showValue({
        title: $scope.t.GOOD_ADD,
        text: $scope.t.GOOD_ENTER_COUNT,
        value: true
      }, function (count) {
        good.count += count;
        good.$update();
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = _.filter($scope.goods, function (good) {
        if (!$scope.search) return true;
        var fields = [
          'code',
          'name',
          'details',
          'country',
          'type'
        ];
        return _.some(fields, function (field) {
          var value = _.get(good, field);
          return value && value.toString().toLowerCase().indexOf($scope.search.toLowerCase()) !== -1;
        });
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

// Order controller
angular.module('data').controller('OrdersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Orders', 'Goods', 'Clients', 'Places', 'ConfirmService', 't',
  function ($scope, $stateParams, $location, Authentication, Orders, Goods, Clients, Places, Confirm, t) {
    $scope.t = t;
    $scope.authentication = Authentication;
    $scope.currency = ' ' + $scope.t.UAH;
    $scope.currentPage = 1;

    var toZero = function (val) {
      return Math.max(0, val);
    };

    $scope.orderTypes = [
      {
        name: $scope.t.ORDER_TYPE_NEW,
        payed: false,
        active: true
      },
      {
        name: $scope.t.ORDER_TYPE_PAYED,
        payed: true,
        active: false
      },
      {
        name: $scope.t.ORDER_TYPE_ALL,
        payed: undefined,
        active: false
      }
    ];

    $scope.statuses = [
      {
        name: $scope.t.ORDER_STATUS_NEW,
        value: 'work',
      },
      {
        name: $scope.t.ORDER_STATUS_READY,
        value: 'ready'
      },
      {
        name: $scope.t.ORDER_STATUS_TOGO,
        value: 'togo'
      },
      {
        name: $scope.t.ORDER_STATUS_DONE,
        value: 'done'
      },
    ];

    $scope.listStatuses = $scope.statuses.concat({
      name: $scope.t.ORDER_TYPE_ALL,
    });

    $scope.updateList = function () {
      var place = $scope.selectedPlace ? $scope.selectedPlace._id : undefined;
      var status = $scope.selectedStatus ? $scope.selectedStatus.value : undefined;
      var payed = _.get($scope.selectedType, 'payed');
      $scope.ordersResolved = Orders.query({
        payed: payed,
        place: place,
        status: status,
        page: $scope.currentPage,
        limit: $scope.itemsPerPage,
        q: $scope.search
      }, function (data) {
        $scope.orders = data.orders;
        $scope.ordersCount = data.count;
        $scope.buildPager();
      });
    };

    $scope.changeType = function (type) {
      if ($scope.selectedType) {
        $scope.selectedType.active = false;
      }
      $scope.selectedType = type;
      $scope.selectedType.active = true;
      $scope.updateList();
    };

    $scope.$watch('selectedPlace', function () {
      if ($scope.selectedType && $scope.selectedPlace && $scope.ordersResolved.$resolved) {
        $scope.changeType($scope.selectedType);
      }
    });

    $scope.$watch('selectedStatus', function () {
      if ($scope.selectedType && $scope.selectedStatus && $scope.ordersResolved.$resolved) {
        $scope.changeType($scope.selectedType);
      }
    });

    $scope.$watch('search', function () {
      $scope.updateList();
    });

    $scope.remove = function (order) {
      if (order) {
        Confirm.show($scope.t.CONFIRM, $scope.t.REMOVE_ORDER_CONF, function () {
          Orders.remove({ orderId: order._id }, function () {
            for (var i in $scope.orders) {
              if ($scope.orders[i] === order) {
                $scope.orders.splice(i, 1);
              }
            }
            $scope.buildPager();
          });
        });
      } else {
        $scope.order.$remove(function () {
          $location.path('orders');
        });
      }
    };

    $scope.update = function (isValid, useOrder, callback) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'orderForm');

        return false;
      }

      var order = useOrder || $scope.order;
      order.total = $scope.calculateTotal(order);

      if (order._id) {
        order.$update(function () {
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        order.$save(function () {
          $location.path('orders');
          if (callback) {
            callback();
          }
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.pay = function (isValid, order, update) {
      Confirm.show($scope.t.CONFIRM, $scope.t.PAY_ORDER_CONF, function () {
        // TODO: optimise this
        if (order._id) {
          order.payed = true;
          $scope.update(isValid, order, function () {
            if (update) {
              $scope.changeType($scope.selectedType);
            }
          });
        } else {
          Orders.get({
            orderId: order
          }, function (data) {
            data.payed = true;
            $scope.update(isValid, data, function () {
              if (update) {
                $scope.changeType($scope.selectedType);
              }
            });
          });
        }
      });
    };

    $scope.find = function () {
      $scope.changeType($scope.orderTypes[0]);
      Places.query(function (data) {
        $scope.places = data;
        $scope.places.unshift({
          name: 'Всі'
        });
        $scope.selectedStatus = $scope.listStatuses[4];
        $scope.selectedPlace = $scope.places[0];
      });
    };

    var calcArray = function (good) {
      if (!$scope.goods) return [];
      var items = [];
      if (good && good._id) {
        items.push(good);
      }
      $scope.goods.forEach(function (g) {
        if (!_.find($scope.order.items, function (item) {
          return item.good && item.good._id === g._id;
        })) {
          if (g.count) {
            items.push(g);
          }
        }
      });
      return items;
    };

    $scope.findOne = function () {
      if ($stateParams.orderId) {
        Orders.get({
          orderId: $stateParams.orderId
        }, function (data) {
          $scope.order = data;
          $scope.calcArray = calcArray;
          $scope.savedOrder = _.cloneDeep(data);
          $scope.title = $scope.t.EDIT_ORDER_NUM + data.code;
          $scope.order.link = 'https://vitaly.herokuapp.com/orders/' + data._id;
          if (!$scope.order.status) {
            $scope.order.status = $scope.statuses[0].value;
          }
        });
      }
      else {
        $scope.order = new Orders();
        $scope.title = $scope.t.NEW_ORDER;
        $scope.order.status = $scope.statuses[0].value;
        $scope.calcArray = calcArray;
      }

      $scope.goods = Goods.query();
      Clients.query(function (data) {
        $scope.clients = data;
      });
      Places.query(function (data) {
        $scope.places = data;
        $scope.places.unshift({
          name: $scope.t.EDIT_MANUALLY
        });
      });
    };

    $scope.calculate = function (price, count) {
      if (!isNaN(price) && !isNaN(count)) {
        return (price * count).toFixed(2) + $scope.currency;
      }
      return 0 + $scope.currency;
    };

    $scope.getPhoneForPreview = function() {
      var phone = $scope.order.client.phone || 'XX';
      return 'XXX XXX XX ' + phone.substring(phone.length - 2, phone.length);
    };

    $scope.addItem = function () {
      var defaultItem = {
        count: 1,
      };
      if (!$scope.order.items) {
        $scope.order.items = [];
      }

      $scope.order.items.push(defaultItem);
    };

    $scope.calculateTotal = function (order) {
      if (!order || !order.items) return;
      var total = 0;
      for (var i=0;i<order.items.length;i++) {
        var item = order.items[i];
        if (item.good && item.good.price && item.count) {
          total += (item.good.price * item.count);
        }
      }
      if (order.sale) {
        total -= order.sale;
      }
      if (order.credit) {
        total += order.credit;
      }
      var totalPrice = Math.max(0, total);
      if (order.extra) {
        return (totalPrice * (1 + order.extra/100)).toFixed(2);
      }
      return totalPrice.toFixed(2);
    };

    $scope.calculateLeft = function (good) {
      var items = $scope.order.items;
      if (!good || !items || !good._id) {
        return;
      }
      var item = _.find(items, function (i) {
        // TODO: temporary realization
        if (!i.good || !good) {
          return false;
        }
        return i.good._id === good._id;
      });
      var savedItem = $scope.savedOrder ? _.find($scope.savedOrder.items, function (i) {
        // TODO: temporary realization
        if (!i.good || !good) {
          return false;
        }
        return good._id === i.good._id;
      }) : null;
      if (!item) {
        if (savedItem) {
          return good.count + savedItem.count;
        }
        return good.count;
      }
      var newItemCount = good.count - item.count;
      if (!savedItem) {
        return toZero(newItemCount);
      }
      return toZero(savedItem.count + newItemCount);
    };

    $scope.cancel = function () {
      $location.path('orders');
    };

    $scope.removeItem = function (item) {
      for (var i in $scope.order.items) {
        if ($scope.order.items[i] === item) {
          $scope.order.items.splice(i, 1);
        }
      }
    };

    $scope.disableSave = function () {
      if (!$scope.order || !$scope.order.items || !$scope.order.items.length) return true;
      var disable = false;
      var findSelectedOrder = function (item) {
        return function (i) {
          // TODO: temporary realization
          if (!i.good || !item.good) return false;
          return i.good._id === item.good._id;
        };
      };
      $scope.order.items.forEach(function (item) {
        var saved = $scope.savedOrder ? _.find($scope.savedOrder.items, findSelectedOrder(item)) : undefined;
        if (!item.count || item.count === 0 || (!item.good) || (!item.good._id) || (item.count > item.good.count && !saved) || (saved && item.count - saved.count > item.good.count)) {
          disable = true;
        }
      });

      return disable;
    };

    $scope.buildPager = function () {
      $scope.itemsPerPage = 20;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.pagedItems = $scope.orders;
    };

    $scope.pageChanged = function () {
      $scope.changeType($scope.selectedType);
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

// Places controller
angular.module('data').controller('PlacesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Places', 't',
  function ($scope, $stateParams, $location, Authentication, Places, t) {
    $scope.t = t;
    $scope.authentication = Authentication;

    $scope.remove = function (place) {
      if (place) {
        place.$remove();

        for (var i in $scope.places) {
          if ($scope.places[i] === place) {
            $scope.places.splice(i, 1);
          }
        }
      } else {
        $scope.place.$remove(function () {
          $location.path('goods');
        });
      }
    };

    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      var place = $scope.place;

      if ($scope.place._id) {
        place.$update(function () {
          $location.path('places');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }

      else {
        place.$save(function () {
          $location.path('places');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.find = function () {
      $scope.places = Places.query();
    };

    $scope.findOne = function () {
      if ($stateParams.placeId) {
        $scope.place = Places.get({
          placeId: $stateParams.placeId
        });
        $scope.title = $scope.t.EDIT_PLACE;
      }
      else {
        $scope.place = new Places();
        $scope.title = $scope.t.NEW_PLACE;
      }
    };

    $scope.cancel = function () {
      $location.path('places');
    };
  }
]);

'use strict';

angular.module('data').factory('Clients', ['$resource',
  function ($resource) {
    return $resource('api/clients/:clientId', {
      clientId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

angular.module('data').factory('Goods', ['$resource',
  function ($resource) {
    return $resource('api/goods/:goodId', {
      goodId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

angular.module('data').factory('Orders', ['$resource',
  function ($resource) {
    return $resource('api/orders/:orderId', {
      orderId: '@_id',
    }, {
      update: {
        method: 'PUT'
      },
      query: {
        method: 'GET', isArray:false
      },
    });
  }
]);

'use strict';

angular.module('data').factory('Places', ['$resource',
  function ($resource) {
    return $resource('api/places/:placeId', {
      placeId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      });
  }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('settings', {
        abstract: true,
        url: '/settings',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html'
      })
      .state('authentication.signup', {
        url: '/signup',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      });
  }
]);

'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$filter', 'Admin',
  function ($scope, $filter, Admin) {
    Admin.query(function (data) {
      $scope.users = data;
      $scope.buildPager();
    });

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.users, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$state', 'Authentication', 'userResolve',
  function ($scope, $state, Authentication, userResolve) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function (user) {
      if (confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = $scope.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 't',
  function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator, t) {
    $scope.t = t;
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator',
  function ($scope, $stateParams, $http, $location, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    $scope.askForPasswordReset = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'forgotPasswordForm');

        return false;
      }

      $http.post('/api/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'resetPasswordForm');

        return false;
      }

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangePasswordController', ['$scope', '$http', 'Authentication', 'PasswordValidator',
  function ($scope, $http, Authentication, PasswordValidator) {
    $scope.user = Authentication.user;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Change user password
    $scope.changeUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'passwordForm');

        return false;
      }

      $http.post('/api/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'passwordForm');
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
  function ($scope, $timeout, $window, Authentication, FileUploader) {
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/users/picture',
      alias: 'newProfilePicture'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Populate user object
      $scope.user = Authentication.user = response;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.user.profileImageURL;
    };
  }
]);

'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = new Users($scope.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SettingsController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    $scope.user = Authentication.user;
  }
]);

'use strict';

angular.module('users')
  .directive('passwordValidator', ['PasswordValidator', function(PasswordValidator) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$validators.requirements = function (password) {
          var status = true;
          if (password) {
            var result = PasswordValidator.getResult(password);
            var requirementsIdx = 0;

            // Requirements Meter - visual indicator for users
            var requirementsMeter = [
              { color: 'danger', progress: '20' },
              { color: 'warning', progress: '40' },
              { color: 'info', progress: '60' },
              { color: 'primary', progress: '80' },
              { color: 'success', progress: '100' }
            ];

            if (result.errors.length < requirementsMeter.length) {
              requirementsIdx = requirementsMeter.length - result.errors.length - 1;
            }

            scope.requirementsColor = requirementsMeter[requirementsIdx].color;
            scope.requirementsProgress = requirementsMeter[requirementsIdx].progress;

            if (result.errors.length) {
              scope.popoverMsg = PasswordValidator.getPopoverMsg();
              scope.passwordErrors = result.errors;
              status = false;
            } else {
              scope.popoverMsg = '';
              scope.passwordErrors = [];
              status = true;
            }
          }
          return status;
        };
      }
    };
  }]);

'use strict';

angular.module('users')
  .directive('passwordVerify', [function() {
    return {
      require: 'ngModel',
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, ngModel) {
        var status = true;
        scope.$watch(function() {
          var combined;
          if (scope.passwordVerify || ngModel) {
            combined = scope.passwordVerify + '_' + ngModel;
          }
          return combined;
        }, function(value) {
          if (value) {
            ngModel.$validators.passwordVerify = function (password) {
              var origin = scope.passwordVerify;
              return (origin !== password) ? false : true;
            };
          }
        });
      }
    };
  }]);

'use strict';

// Users directive used to force lowercase input
angular.module('users').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  };
});

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);

'use strict';

// PasswordValidator service used for testing the password strength
angular.module('users').factory('PasswordValidator', ['$window',
  function ($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    return {
      getResult: function (password) {
        var result = owaspPasswordStrengthTest.test(password);
        return result;
      },
      getPopoverMsg: function () {
        var popoverMsg = 'Please enter a passphrase or password with greater than 10 characters, numbers, lowercase, upppercase, and special characters.';
        return popoverMsg;
      }
    };
  }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
