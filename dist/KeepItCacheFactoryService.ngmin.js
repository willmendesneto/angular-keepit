angular.module('KeepIt').provider('KeepItCacheFactoryService', [
  'KeepItProvider',
  function (KeepItProvider) {
    KeepItProvider.registerModule('KeepItCacheFactoryService', KeepItProvider.types.MEMORY);
    return {
      $get: [
        '$cacheFactory',
        function ($cacheFactory) {
          return function (cacheId) {
            return {
              module: $cacheFactory(cacheId),
              _put: function (key, value) {
                this.module.put(key, value);
              },
              _get: function (key) {
                return this.module.get(key);
              },
              _remove: function (key) {
                this.module.remove(key);
              },
              _destroy: function () {
                this.module.destroy();
              }
            };
          };
        }
      ]
    };
  }
]);