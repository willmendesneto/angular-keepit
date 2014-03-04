angular-keepit
==============

This module is an impersonalization layer for using cache/memoization in angular JS.

## How is it different from caching other modules? 

This module provides an interface for other modules to extend the way the data is kept.
For now there is two different ways to keep data: angular's CacheFactory (IN MEMORY) and native localStorage (PERSISTANT).

It also provides a layer for implemeting a TTL which can be configured to be invalidated using a "cron" or it can be checked every time the cache is accessed.

A CacheInterface enhances any module that implements it to be able to use TTL.

## How does it work ?

STILL TO BE IMPLEMENTED in the following feature set  : Cache module autoloading/configuration

Include keepit as a dependency of your app, and also the caching modules you want to enable.
At configuration runtime, the included cache modules will register themselves to KeepIt saying to which cache type they belong (IN_MEMORY,PERSITENT,SESSION).

In your app, you inject keepit and use it like this:
```javascript
  var data,
  //instanciate module if not existing, else returns the existing module
  myCacheModule = KeepIt.getModule('SomeCacheID',KeepIt.types.IN_MEMORY); 
  
  data = myCacheModule.getValue("myData");
  
  if ( data === null){
    //inexistant or expired cache
    data = WhateverRoutine.getData();
    myCacheModule.put("myData",data,300);//put the data in cache for 300 seconds
  }
  [...]
```

If kept data you want to keep isbound to a scope, it can be automatically refreshed. In your controller:
```javascript
  myCacheModule = KeepIt.getModule('SomeCacheID',KeepIt.types.PERSITENT); 
  $scope.whateverModel = myCacheModule.getValue("myCacheKey");
  myCacheModule.syncToModel("myCacheKey",$scope,"whateverModel");
  
```
In background, all it does is creating a $watch expression on the scope and update the cache accordingly.

## What is necessary to create my own cache interface?

(todo : add link to KeepItCacheFactoryService.js File)
look for KeepItCacheFactoryService.js which is one of the simplest implementation I have, and it uses $cacheFactory which is well known to angular enthousiasts.

#API Documentation
TODO 

#Cache Interface Documentation 
TODO
