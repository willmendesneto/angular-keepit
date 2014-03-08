angular.module('KeepIt').provider('KeepItSessionStorageService', [
  'KeepItProvider',
  function (KeepItProvider) {
    KeepItProvider.registerModule('KeepItSessionStorageService', KeepItProvider.types.SESSION);
    return {
      $get: function () {
        return function (cacheId) {
          return {
            cacheId: cacheId,
            module: sessionStorage,
            computeKey: function (key) {
              return '_KeepItModule_' + cacheId + key;
            },
            _put: function (key, value) {
              sessionStorage.setItem(this.computeKey(key), JSON.stringify(value));
            },
            _get: function (key) {
              return JSON.parse(sessionStorage.getItem(this.computeKey(key)));
            },
            _remove: function (key) {
              sessionStorage.removeItem(this.computeKey(key));
            },
            _destroy: function () {
              //remove registered keys, one by one since we might have values from other module in sessionStorage
              angular.forEach(this.registeredKeys, function (value, key) {
                sessionStorage.removeItem(this.computeKey(key));
              });
            }
          };
        };
      }
    };
  }
]);