/**
 * todo: Add tests for destroy and convert features
 */
describe("KeepIt", function () {

    var _KeepIt,
        _$interval,
        _$rootScope;

    var EXPIRY_CYCLE = 10,
        CACHE_KEY = "MyKey",
        CACHE_VALUE = {myObject:"toStore"};

    beforeEach(module("KeepIt",function(KeepItProvider){
        KeepItProvider.timedExpiryCheckCycle = EXPIRY_CYCLE;

        //set the service to use this value as now when creating cache
        var now = new Date().getTime()/1000;
        KeepItProvider.unitTestNow = now ;

        //set the service to use this value as now when checking cache expiry
        KeepItProvider.unitTestNowCycleEnd = now + EXPIRY_CYCLE;
    }));

    beforeEach(inject(function (KeepIt,$interval,$rootScope) {
        _KeepIt = KeepIt;
        _$interval = $interval;
        _$rootScope = $rootScope;
    }));

    it("should be properly injected", function () {
        expect(_KeepIt).not.toBe(null);
        expect(_KeepIt).not.toBe(undefined);

        expect(_$interval).not.toBe(null);
        expect(_$interval).not.toBe(undefined);

        expect(_$rootScope).not.toBe(null);
        expect(_$rootScope).not.toBe(undefined);

    });

    describe("cache module implementation", function () {

        afterEach(function(){
           localStorage.clear();
        });
        it("should list available cache types with a unique numeric identifier within the object 'types'",function(){
            expect(typeof _KeepIt.types).toEqual("object");

            var found = [];
            for (var i in _KeepIt.types){
                if (_KeepIt.types.hasOwnProperty(i)){
                    expect(typeof _KeepIt.types[i]).toEqual("number");
                    found.push(_KeepIt.types[i]);
                }
            }

            found.sort();
            //once sorted, if a value is the same of is predecessor, it means a duplicate key, this way we don't need an heavy comparison sorting/function
            for (var i =1 ; i < found.length; i++){
                expect(found[i]).not.toEqual(found[i-1]);
            }

            for (var i =1 ; i < found.length; i++){
                expect(found[i]).not.toEqual(found[i-1]);
            }

        });

        it("should implement CacheInterface",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){
                    var cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);

                        expect(typeof cache.validateInterface).toBe("function");

                }
            }
        });

        it("should meet CacheInterface requirements",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){
                    var cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    expect(typeof cache).toBeDefined();
                    expect(cache.validateInterface()).toBe(true);

                }
            }
        });

        it("should store a value and be able to retrieve it",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){
                    var cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.TIMED;
                    cache.put(CACHE_KEY,CACHE_VALUE,10);

                    var value = cache.get(CACHE_KEY);
                    expect(value.value).toEqual(CACHE_VALUE);
                }
            }
        });

        it("should not invalidate timed cache if the expiry check cycle is not reached",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){
                    var cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.TIMED;
                    cache.put(CACHE_KEY,CACHE_VALUE,10);
                    _$interval.flush(EXPIRY_CYCLE-10);// check to run intervals that are before the cache check
                    var value = cache.get(CACHE_KEY);
                    expect(value.value).toEqual(CACHE_VALUE);
                }
            }
        });

        it("should not invalidate timed cache if the expiry check cycle is reached but ttl is not",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){
                    var cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.TIMED;
                    cache.put(CACHE_KEY,CACHE_VALUE,EXPIRY_CYCLE + 10);

                    _$interval.flush(EXPIRY_CYCLE);
                    var value = cache.get(CACHE_KEY);
                    expect(value.value).toEqual(CACHE_VALUE);
                }
            }
        });

        it("should invalidate timed cache if the expiry check cycle and ttl are reached",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){

                    var cache,
                        value;

                        cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                        cache.expireCheckMethod = _KeepIt.expiryCheckMethods.TIMED;
                        cache.put(CACHE_KEY,CACHE_VALUE,EXPIRY_CYCLE);
                        //cannot use flushed interval beacuse the function itselfs checks for date().getTime() which is not fastfowarded
                        _$interval.flush(EXPIRY_CYCLE*2);//flush all intervals that are to be run within the specified delay

                        value = cache.get(CACHE_KEY);
                        expect(value).toBeNull();


                }
            }
        });
        it("should not invalidate on the fly cache if the expiry is not reached",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){

                    var cache,
                        value;

                    //_$rootScope.$apply();
                    cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.ON_THE_FLY;
                    cache.put(CACHE_KEY,CACHE_VALUE,EXPIRY_CYCLE + 1) ;

                    value = cache.get(CACHE_KEY);
                    expect(value).not.toBeNull();
                    expect(value.value).toEqual(CACHE_VALUE);



                }
            }
        });

        it("should invalidate on the fly cache if the expiry is reached",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.registeredModules.hasOwnProperty(i)){

                    var cache,
                        value;

                    //_$rootScope.$apply();
                    cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.ON_THE_FLY;
                    cache.put(CACHE_KEY,CACHE_VALUE,0);

                    value = cache.get(CACHE_KEY);
                    expect(value).toBeNull();


                }
            }
        });
        it("should never invalidate cache when no TTL is given",function(){
            for (var i in _KeepIt.registeredModules){
                if (_KeepIt.typregisteredModuleses.hasOwnProperty(i)){

                    var cache,
                        value;

                    //_$rootScope.$apply();
                    cache = _KeepIt.getModule("testModule" + i ,_KeepIt.registeredModules[i]);
                    cache.expireCheckMethod = _KeepIt.expiryCheckMethods.ON_THE_FLY;
                    cache.put(CACHE_KEY,CACHE_VALUE);
                    value = cache.get(CACHE_KEY);
                    expect(value.value).toEqual(CACHE_VALUE);


                }
            }
        });
    });
});