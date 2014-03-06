angular.module('KeepIt').provider('KeepItCacheFactoryService', [
  'KeepItProvider',
  function (KeepItProvider) {
    return {
      $get: [
        '$cacheFactory',
        function ($cacheFactory) {
          console.log('ICI');
          KeepItProvider.registerModule('KeepItCacheFactoryService', KeepItProvider.types.IN_MEMORY);
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