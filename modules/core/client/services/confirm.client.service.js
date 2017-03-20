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