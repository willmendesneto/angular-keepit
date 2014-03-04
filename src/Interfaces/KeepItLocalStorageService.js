angular.module("KeepIt").factory("KeepItLocalStorageService",
    function(){

    return function(cacheId){
       return {
            cacheId : cacheId,
            module              : localStorage,
            computeKey: function(key){
                return "_KeepItModule_" + cacheId + key;
            },
            _put:function(key,value){
                localStorage.setItem(this.computeKey(key), JSON.stringify(value));
            },
            _get:function(key){
                return JSON.parse(localStorage.getItem(this.computeKey(key)))
            },
            _remove:function(key){
                localStorage.removeItem(this.computeKey(key));
            },
            _destroy:function(){
                //remove registered keys, one by one since we might have values from other module in localStorage
                angular.forEach(this.registeredKeys,function(value,key){
                    localStorage.removeItem(this.computeKey(key));
                });
            }
        };
    }
});