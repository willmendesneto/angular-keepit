/**
 * KeepIt is a wrapper class allowing us to adapt cache implementation without having to modify the
 * whole app. It also regroup memoization and persistent (for offline for example) cache inside a same service
 */
angular.module('KeepIt', []).provider('KeepIt', function () {
  var KeepItProvider, KeepItService, modules = {};
  /**
        * This is the starting point for implementing a cache module. This objects has to be extended by
        * any cache module.
        * @param cacheId
        * @param type
        * @returns {{cacheId: *, expireCheckMethod: null, validateInterface: Function}}
        * @constructor
        */
  function CacheInterface(cacheId, type) {
    function validateFunction(object, fn, parameters) {
      if (!angular.isFunction(object[fn])) {
        throw 'Cache Module should implement function \'{0}({1})\''.format(fn, parameters.join(', '));  //return false;
      } else if (object[fn].length != parameters.length) {
        throw 'Cache Module function \'{0}\' should expect {1} parameter(s) ({2})'.format(fn, parameters.length, parameters.join(', '));
      }
      return true;
    }
    function validateExpiryCheckMethod(cache) {
      if (angular.isUndefined(cache.expireCheckMethod) || cache.expireCheckMethod == null || angular.isUndefined(KeepItProvider.expiryCheckMethods[cache.expireCheckMethod])) {
        throw 'expireCheckMethod must be set to a valid value of KeepItProvider.expiryCheckMethods';  //return false;
      }
      return true;
    }
    /**
           * Returns the value within object using a string to identify the value to get.
           * Ex. to get "model" in obj.level1.model in obj, you call getPropertyValueFromString(obj,'level1.model')
           * @param obj
           * @param propertiesString
           * @returns {*}
           */
    function getPropertyValueFromString(obj, propertiesString) {
      var properties = propertiesString.split('.');
      var value = obj[properties[0]];
      if (properties > 1) {
        for (var i = 1; i < properties.length; i++) {
          value = value[properties[i]];
        }
      }
      return value;
    }
    var module = {
        cacheId: cacheId,
        expireCheckMethod: KeepItProvider.defaultExpiryCheckMethod,
        registeredKeys: {},
        registeredToRefresh: {},
        type: type,
        isDestroyed: false,
        init: function () {
          if (type === KeepItProvider.types.PERSISTENT) {
            //for persistent types, we must also preserve the registered keys so getAllKeys keeps returning all corresponding values.
            var keystore = this.get('_KeyStore' + this.cacheId);
            this.registeredKeys = keystore !== null ? keystore.getValue() : [];
          }
        },
        _putRaw: function (key, rawValue) {
          this.registeredKeys[key] = true;
          return this._put(key, rawValue);
        },
        put: function (key, value, ttl) {
          var toStore = {
              expireOn: null,
              value: value
            };
          if (angular.isDefined(ttl)) {
            if (isNaN(ttl)) {
              throw 'ttl must be a valid number. Specified value was : ' + ttl;  //return;
            }
            var now = KeepItProvider.unitTestNow || new Date().getTime() / 1000;
            toStore.expireOn = now + ttl;
          }
          if (this.type === KeepItProvider.types.PERSISTENT) {
            //for persistent types, we must also preserve the registered keys so getAllKeys keeps returning all corresponding values.
            this.put('_KeyStore' + this.cacheId, this.registeredKeys);
          }
          this.registeredKeys[key] = true;
          return this._put(key, toStore);
        },
        get: function (key) {
          var data = this._get(key);
          if (angular.isDefined(data) && data != null) {
            if (this.expireCheckMethod == KeepItProvider.expiryCheckMethods.ON_THE_FLY) {
              if (KeepItProvider.invalidateCacheKey(this, key, data)) {
                return null;
              }
            }
            return data;
          } else {
            return null;
          }
        },
        getValue: function (key, defaultValue) {
          var cacheValue = this.get(key);
          if (cacheValue != null && angular.isDefined(cacheValue.value)) {
            return cacheValue.value;
          }
          if (angular.isDefined(defaultValue)) {
            return defaultValue;
          }
          return null;
        },
        syncToModel: function (key, scope, modelPath, deepMonitoring) {
          if (angular.isUndefined(deepMonitoring)) {
            deepMonitoring = false;
          }
          scope.$watch(modelPath, function (value) {
            module.put(key, value);
          }, deepMonitoring);
        },
        registerToRefresh: function (key, scope, modelPath) {
          module.registeredToRefresh.push({
            key: key,
            scope: scope,
            modelPath: modelPath
          });
        },
        refresh: function () {
          angular.forEach(module.registeredToRefresh, function (toUpdate) {
            module.put(toUpdate.key, getPropertyValueFromString(toUpdate.scope, toUpdate.modelPath));
          });
        },
        getAllKeys: function () {
          return this.registeredKeys;
        },
        remove: function (key) {
          delete this.registeredKeys[key];
          this._remove(key);
        },
        destroy: function () {
          this.registeredKeys = {};
          this._destroy();
          this.isDestroyed = true;
        },
        validateInterface: function () {
          if (angular.isUndefined(this.cacheId)) {
            throw 'You must set a cache id';  //return false;
          }
          return !(!validateFunction(this, '_get', ['key']) || !validateFunction(this, '_put', [
            'key',
            'value'
          ]) || !validateFunction(this, '_remove', ['key']) || !validateFunction(this, '_destroy', [] || !validateExpiryCheckMethod(this)));
        }
      };
    return module;
  }
  function createModule($injector, cacheId, type) {
    var moduleName = KeepItProvider.registeredModules[type], module = null;
    $injector.invoke([
      moduleName,
      function (CacheModule) {
        module = new CacheInterface(cacheId, type);
        angular.extend(module, new CacheModule(cacheId));
        module.init();
      }
    ]);
    return module;
  }
  ;
  KeepItProvider = {
    expiryCheckMethods: {
      ON_THE_FLY: 1,
      TIMED: 2
    },
    timedExpiryCheckCycle: 60 * 1000,
    defaultExpiryCheckMethod: null,
    types: {
      MEMORY: 1,
      PERSISTENT: 2,
      SESSION: 3
    },
    registeredModules: {},
    registerModule: function (moduleName, type) {
      KeepItProvider.registeredModules[type] = moduleName;
    },
    invalidateCache: function () {
      angular.forEach(modules, function (module, cacheId) {
        var keys = module.getAllKeys();
        angular.forEach(keys, function (value, key) {
          KeepItProvider.invalidateCacheKey(module, key);
        });
      });
    },
    invalidateCacheKey: function (module, key, stored) {
      var now = KeepItProvider.unitTestNowCycleEnd || new Date().getTime() / 1000;
      if (angular.isUndefined(stored)) {
        stored = module.get(key);
      }
      if (stored.expireOn != null && now >= stored.expireOn) {
        module.remove(key);
        return true;
      }
      return false;
    },
    $get: [
      '$interval',
      '$rootScope',
      '$injector',
      function ($interval, $rootScope, $injector) {
        KeepItService = {
          expiryCheckMethods: KeepItProvider.expiryCheckMethods,
          types: KeepItProvider.types,
          getModule: function (cacheId, type) {
            if (angular.isUndefined(type)) {
              type = KeepItService.types.MEMORY;
            }
            var isTypeRegistered = false;
            angular.forEach(KeepItProvider.registeredModules, function (serviceName, serviceType) {
              if (serviceType == type) {
                isTypeRegistered = true;
              }
            });
            if (!isTypeRegistered) {
              throw 'Trying to load a module type that is not implemented (did you forgot to include the required interface ?';
            }
            //create cache module if does not exist
            if (angular.isUndefined(modules[cacheId]) || modules[cacheId].isDestroyed) {
              modules[cacheId] = createModule($injector, cacheId, type);
            } else if (modules[cacheId].type !== type) {
              throw 'The cache module your are trying to get already exists but is of a different type: ' + modules[cacheId].type + ' (asking for + ' + KeepItService.types[type] + ')';  //return;
            }
            return modules[cacheId];
          },
          convertType: function (cacheId, newType) {
            var currentModule = modules[cacheId], keys = currentModule.getAllKeys(), i = 0;
            var newModule = createModule($injector, cacheId, newType);
            for (i = 0; i < keys.length; i++) {
              newModule._putRaw(keys[i], currentModule.get(keys[i]));
            }
            return modules[cacheId] = newModule;
          },
          destroyModule: function (module) {
            if (angular.isString(module)) {
              module = this.getModule(module);
            }
            module.destroy();
            delete modules[module.cacheId];
          },
          clearAll: function () {
            angular.forEach(modules, function (module, cacheId) {
              module.destroy();
            });
            modules = {};
          },
          invalidateCache: KeepItProvider.invalidateCache,
          invalidateCacheKey: KeepItProvider.invalidateCacheKey
        };
        /**
                 * checks all timed expiry cache module and invalidate them when expireOn is reached
                 */
        (function initTimedExpiryCheck() {
          $interval(KeepItProvider.invalidateCache, KeepItProvider.timedExpiryCheckCycle);
        }());
        return KeepItService;
      }
    ]
  };
  if (KeepItProvider.defaultExpiryCheckMethod == null) {
    KeepItProvider.defaultExpiryCheckMethod = KeepItProvider.expiryCheckMethods.ON_THE_FLY;
  }
  return KeepItProvider;
});