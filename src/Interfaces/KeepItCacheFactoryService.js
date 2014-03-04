angular.module("KeepIt").factory("KeepItCacheFactoryService",
    function(
        $cacheFactory){
        return function (cacheId){
            return {
                module              : $cacheFactory(cacheId),
                /**
                 *
                 * @param key item key
                 * @param value item value
                 */
                _put: function(key,value){
                    this.module.put(key,value);
                },
                /**
                 * returns the cached item, if found.
                 * @param key
                 */
                _get: function(key){
                    return  this.module.get(key);
                },
                _remove : function (key){
                    this.module.remove(key);
                },
                _destroy : function (){
                    this.module.destroy();
                }

            }
        }
    }
);