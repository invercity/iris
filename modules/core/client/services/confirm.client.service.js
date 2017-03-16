'use strict';

angular.module('data').factory('ConfirmService', ['$modal', function ($modal) {
  return {
    show: function (title, text, confirm, decline) {
      var modalInstance = $modal.open({
        animation: true,
        templateUrl: 'modules/core/client/views/confirm.client.view.html',
        controller: 'ConfirmController',
        resolve: {
          data: {
            confirmText: text,
            confirmTitle: title,
          }
        }
      });

      modalInstance.result.then(function (is) {
        if (confirm && is) {
          confirm();
        }
      }, function () {
        if (decline) {
          decline();
        }
      });
    }
  };
}]);