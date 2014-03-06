angular.module("KeepIt").provider("KeepItCacheFactoryService",
   function (KeepItProvider){



      return {

         $get:function(
            $cacheFactory){
            console.log("ICI");
            KeepItProvider.registerModule("KeepItCacheFactoryService",KeepItProvider.types.IN_MEMORY);
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
      }
   }
);