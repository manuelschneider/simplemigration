'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' All rights reserved. */',
    // Task configuration.
    usebanner: {
      all: {
        options: {
          position: 'bottom',
          banner: '<%= banner %>\n' +
            'require(\'source-map-support\').install();',
        },
        files: {
          src: [ 'SimpleMigration.js', 'storages/StorageModule.js', 'storages/**/index.js' ]
        }
      },
    },
    coffee: {
      root: {
        options: {
          sourceMap: true
        },
        expand: true,
        flatten: false,
        src: ['SimpleMigration.coffee'],
        ext: '.js'
      },
      storages: {
        options: {
          sourceMap: true,
        },
        expand: true,
        flatten: false,
        cwd: 'storages/',
        src: ['**/*.coffee'],
        dest: 'storages/',
        ext: '.js'
      }
    },
    coffeelint: {
      dist: {
        options: grunt.file.readJSON('coffeelint.json'),
        files: {
          src: [ 'storages/StorageModule.coffee', 'storages/*/index.coffee', 'SimpleMigration.coffee' ]
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coffee-script'
        },
        src: ['storages/*_specs.coffee', 'SimpleMigration_specs.coffee' ]
      }
    },
    watch: {
      scripts: {
        files: [ "**/*.coffee" ],
        tasks: ['default']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task.
  grunt.registerTask('default', [ 'coffeelint', 'coffee', 'usebanner', 'mochaTest']);

};
