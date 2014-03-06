/**
 * KeepIt is a wrapper class allowing us to adapt cache implementation without having to modify the
 * whole app. It also regroup memoization and persistent (for offline for example) cache inside a same service
 */
angular.module("KeepIt",[]).provider("KeepIt",
    function(

        ){
        var KeepItProvider,
            modules = {};


       /**
        * This is the starting point for implementing a cache module. This objects has to be extended by
        * any cache module.
        * @param cacheId
        * @param type
        * @returns {{cacheId: *, expireCheckMethod: null, validateInterface: Function}}
        * @constructor
        */
        function CacheInterface(cacheId,type){

            function validateFunction(object,fn, parameters){
                if (!angular.isFunction(object[fn])){
                    throw("Cache Module should implement function '{0}({1})'".format(fn, parameters.join(", ")));
                    //return false;
                }else if (object[fn].length != parameters.length){
                    throw("Cache Module function '{0}' should expect {1} parameter(s) ({2})".format(fn, parameters.length,parameters.join(", ")));
                }
                return true;
            }

            function validateExpiryCheckMethod(cache){
                if (angular.isUndefined(cache.expireCheckMethod) ||
                    cache.expireCheckMethod == null ||
                    angular.isUndefined( KeepItProvider.expiryCheckMethods[cache.expireCheckMethod])){
                    throw("expireCheckMethod must be set to a valid value of KeepItProvider.expiryCheckMethods");
                    //return false;
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
            function getPropertyValueFromString(obj,propertiesString){
                var properties = propertiesString.split('.');
                var value = obj[properties[0]];

                if (properties > 1){
                  for(var i = 1 ; i < properties.length ; i++){
                    value = value[properties[i]];
                  }
                }

                return value;

            }
            var module;
            return module = {
                cacheId : cacheId,
                expireCheckMethod : KeepItProvider.defaultExpiryCheckMethod,
                registeredKeys      : {}, //cacheFactory doesn't give access to existing keys, so we keep track in this array
                registeredToRefresh : {}, //Keys registered here will be updated when module.refresh() is called
                type                : type,
                put:function(key,value,ttl){
                    var toStore = {
                        expireOn: null,
                        value : value
                    };

                    if (angular.isDefined(ttl)){
                        if (isNaN(ttl)){
                            throw("ttl must be a valid number. Specified value was : " + ttl);
                            //return;
                        }
                        var now = KeepItProvider.unitTestNow || new Date().getTime() / 1000 ;
                        toStore.expireOn = now + ttl;

                    }
                    this.registeredKeys[key] = true;
                    return this._put(key,toStore);

                },
                get:function(key){

                    var data = this._get(key);
                    if (angular.isDefined(data) && data != null){

                        if (this.expireCheckMethod  == KeepItProvider.expiryCheckMethods.ON_THE_FLY ){
                            if (KeepItProvider.invalidateCacheKey(this,key,data)){
                                return null;
                            }

                        }
                        return data;
                    }else{
                        return null;
                    }

                },
                getValue:function(key){
                  var cacheValue = this.get(key);
                  if (cacheValue != null && angular.isDefined(cacheValue.value)){
                    return cacheValue.value;
                  }
                  return null;
                },
              /**
               * synchronize cache key with a model on change.
               * @param key
               * @param scope
               * @param modelPath
               */
                syncToModel : function(key,scope,modelPath,deepMonitoring){
                  if (angular.isUndefined(deepMonitoring)){
                    deepMonitoring = false;
                  }
                  scope.$watch(modelPath,function(value){
                    module.put(key,value);
                  },deepMonitoring);
                },
                registerToRefresh : function(key,scope,modelPath){
                  module.registeredToRefresh.push({key:key,scope:scope,modelPath:modelPath})
                },
                refresh : function(){
                  angular.forEach(module.registeredToRefresh,function(toUpdate){
                    module.put(toUpdate.key,getPropertyValueFromString(toUpdate.scope,toUpdate.modelPath));
                  });
                },
                getAllKeys:function(){
                    return this.registeredKeys;
                },
                remove:function(key){
                    delete this.registeredKeys[key];
                    this._remove(key);
                },
                destroy:function(){
                    this.registeredKeys = {};
                    this._destroy();
                },
                validateInterface : function(){

                    if (angular.isUndefined(this.cacheId)){
                        throw("You must set a cache id");
                        //return false;
                    }

                    return !(!validateFunction(this,"_get",["key"]) ||
                        //!validateFunction(this,"_getAllKeys",[]) ||
                        !validateFunction(this,"_put",["key","value"]) ||
                        !validateFunction(this,"_remove",["key"]) ||
                        !validateFunction(this,"_destroy",[] ||
                            !validateExpiryCheckMethod(this))
                        );
                }
            };

        }

        KeepItProvider = {

            expiryCheckMethods          : {
                                            ON_THE_FLY: 1, //check for expiry each time the cache is accessed or expiryCycle is reached
                                            TIMED: 2 //run at timedExpiryCheckCycle interval on all cached object
                                        },
            timedExpiryCheckCycle       : 60 * 1000,// cycle frequency on which the ttl's are verified, if type is expiryCheckMethods.TIMED
            defaultExpiryCheckMethod    : null,
            types                       :{
                                             MEMORY: 1,
                                             PERSISTENT: 2
                                          },
            registeredModules : {},
            registerModule:function(moduleName,type){
                console.log(type + " - " + moduleName)
                KeepItProvider.registeredModules[type] = moduleName;

            },
            /**
             * Used to manually check expired cache. fastForward is a delay in seconds for which
             * we want to invalidate expiry in the future. This is specially useful for test cases
             */
            invalidateCache:function(){
                angular.forEach(modules,function(module,cacheId){
                    var keys = module.getAllKeys();

                    angular.forEach(keys,function(value,key){
                        KeepItProvider.invalidateCacheKey(module,key);
                    });
                });

            },
            /**
             * Invalidate the cache key in the module if it's expired
             * @param module
             * @param key
             * @param stored
             * @returns {boolean} true if the cache was invalidated
             */
            invalidateCacheKey:function(module,key,stored){
                var now = KeepItProvider.unitTestNowCycleEnd || new Date().getTime() / 1000 ;
                if (angular.isUndefined(stored)){
                    stored = module.get(key);
                }
                if (stored.expireOn != null && now >= stored.expireOn){
                    module.remove(key);
                    return true;
                }
                return false;
            },
            $get:function(

                $interval,
                $rootScope,
                $injector){

                var KeepItService;

                KeepItService = {
                    //expose provider settings to the service API
                    expiryCheckMethods      : KeepItProvider.expiryCheckMethods,
                    types                   : KeepItProvider.types,
                    /**
                     * Return the module bound to the cacheId, or create it if not existing.
                     * @param cacheId
                     * @param type must be a value of KeepItService.types
                     * @returns {*}
                     */
                    getModule: function(cacheId, type){

                        if (angular.isUndefined(type)){
                            type = KeepItService.types.MEMORY;
                        }

                        //create cache module if does not exist
                        if (angular.isUndefined(modules[cacheId])){
                            var moduleName = KeepItProvider.registeredModules[type];

                            $injector.invoke([moduleName,function(CacheModule){
                                modules[cacheId] = new CacheInterface(cacheId,type );
                                angular.extend( modules[cacheId], new CacheModule(cacheId));
                            }]);

                        }else if (modules[cacheId].type !== type){
                            throw ("The cache module your are trying to get already exists but is of a different type: " +
                                modules[cacheId].type + " (asking for + " +  KeepItService.types[type] + ")");
                            //return;
                        }

                        return modules[cacheId];
                    },
                    /**
                     * Clears all the existing modules.
                     */
                    clearAll : function (){
                        angular.forEach(modules,function(module,cacheId){
                           module.destroy();
                        });
                        modules = {};
                    },
                    invalidateCache     : KeepItProvider.invalidateCache,
                    invalidateCacheKey  : KeepItProvider.invalidateCacheKey
                };

                /**
                 * checks all timed expiry cache module and invalidate them when expireOn is reached
                 */
                (function initTimedExpiryCheck(){
                    $interval(KeepItProvider.invalidateCache, KeepItProvider.timedExpiryCheckCycle);
                })();

                return KeepItService;
            }

        };

        if (KeepItProvider.defaultExpiryCheckMethod == null){
            KeepItProvider.defaultExpiryCheckMethod = KeepItProvider.expiryCheckMethods.ON_THE_FLY;
        }

        return KeepItProvider;
});