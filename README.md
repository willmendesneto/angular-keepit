angular-keepit
==============

This module is an impersonalization layer for using cache/memoization in angular JS.

## How is it different from caching other modules? 

This module provides an interface for other modules to extend the way the data is kept.
For now there is two different ways to keep data: angular's CacheFactory (IN MEMORY) and native localStorage (PERSISTANT).

It also provides a layer for implemeting a TTL which can be configured to be invalidated using a "cron" or it can be checked every time the cache is accessed.

A CacheInterface enhances any module that implements it to be able to use TTL.

## How does it work ?

Include keepit as a dependency of your app, and also the caching modules you want to enable.
At configuration runtime, the included cache modules will register themselves to KeepIt saying to which cache type they belong (MEMORY,PERSITENT,SESSION).

In your app, you inject keepit and use it like this:
```javascript
  var data,
  //instanciate module if not existing, else returns the existing module
  myCacheModule = KeepIt.getModule('SomeCacheID',KeepIt.types.MEMORY); 
  
  data = myCacheModule.getValue("myData");
  
  if ( data === null){
    //inexistant or expired cache
    data = WhateverRoutine.getData();
    myCacheModule.put("myData",data,300);//put the data in cache for 300 seconds
  }
  [...]
```

If kept data you want to keep isbound to a scope, it can be automatically refreshed. 
In your controller:
```javascript
  myCacheModule = KeepIt.getModule('SomeCacheID',KeepIt.types.PERSITENT); 
  $scope.whateverModel = myCacheModule.getValue("myCacheKey");
  myCacheModule.syncToModel("myCacheKey",$scope,"whateverModel");
  
```
In background, all it does is creating a $watch expression on the scope and update the cache accordingly. It cannot use objects with deep monitoring right now, this as to be implemented/tested.

## What is necessary to create my own cache interface?

look for [KeepItCacheFactoryService.js](src/Interfaces/KeepItCacheFactoryService.js) which is one of the simplest implementation I have, and it uses $cacheFactory which is well known to angular enthousiasts.

#Configurations
TODO

Expire method (on the fly, timed)
Expire check delay


#Limitations

As it is right know, there is no implementation of cache interface returning promises, which would allow you to have an external asynchroous service to store/retrieve values. This would be theoratically possible if the module retunrns promises as values, and the code calling it know that it's a promise. Doing so would probably work but beats the goal of having an uniformized way of using cache interfaces. This still need some thinking if it was to be implemented in the future. (I could always return promises but this would remove the simplicity of usage).

#API Documentation
TODO 

#Cache Interface Documentation 
TODO
