module.exports = function (grunt) {
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      // uglify: {
      //   options: {
      //     banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      //   },
      //   build: {
      //     src: 'src/www/js/<%= pkg.name %>.js',
      //     dest: 'build/www/js/<%= pkg.name %>.min.js'
      //   }
      // },

      ngmin: {
         module: {
            src: [  "src/KeepIt.js" ],
            dest: "dist/KeepIt.min.js"
         },
         localStorage:{
            src: [  "src/Interfaces/KeepItCacheFactoryService.js"],
            dest: "dist/KeepItCacheFactoryService.js"
         },
         cacheFactory:{
            src: [  "src/Interfaces/KeepItLocalStorageService.js"],
            dest: "dist/KeepItLocalStorageService.js"

         }
      },
      watch: {
         normal: {
            files: ['src/***'],
            tasks: ['default']
         }
      }
   });

   grunt.loadNpmTasks("grunt-ngmin");
   grunt.loadNpmTasks('grunt-contrib-uglify');
   //grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-watch');

   // Default task(s).
   grunt.registerTask('default', ['ngmin']);
   grunt.registerTask('watch', ['watch:normal']);
};