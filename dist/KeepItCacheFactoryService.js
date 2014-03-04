angular.module('KeepIt').factory('KeepItCacheFactoryService', [
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
]);