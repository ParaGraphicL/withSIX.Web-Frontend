module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  var fs = require('fs');
  //grunt.loadNpmTasks('grunt-typescript');
  grunt.initConfig({
    // TODO: Grunt watch uses slow fs.watchFile - either use alternative watch... or hmm
    // https://www.npmjs.org/package/grunt-fast-watch
    // http://tech.nitoyon.com/en/blog/2013/10/10/grunt-watch-slow/
    watch: {
      options: {
        //spawn: false,
        interval: 2000
      },
      // libs: {
      //     files: 'src_legacy/vendor/**/*.js',
      //     tasks: ['uglify:libs', 'shell:toast:libs']
      // },
      // bower_components: {
      //     files: ['bower_components/**/*.js', 'bower.json'],
      //     tasks: ['bower_concat', 'shell:toast:bower_components']
      // },
      // bower_views: {
      //     files: 'bower_components/**/*.html',
      //     tasks: ['ngtemplates:bower', 'bower_concat', 'shell:toast:bower_views']
      // },
      // bower: {
      //     files: 'bower.json',
      //     tasks: ['shell:bower', 'shell:toast:bower']
      // },
      metadata: {
        files: [
          '../Libraries/SN.withSIX.UpdateBreeze.Library/bin/Release/SN.withSIX.UpdateBreeze.Library.dll'
        ],
        tasks: ['metadata', 'shell:toast:metadata']
      }
    },
    bgShell: {
      _defaults: {
        bg: true
      },

      watchGulp: {
        cmd: 'gulp watch-only'
      }
    },
    shell: {
      prepare: {
        command: function() {
          return 'gulp scripts build-system build-other'
        }
      },
      build_metadata: {
        // Target
        command: function() {
          if (!fs.existsSync('..\\Libraries\\SN.withSIX.UpdateBreeze.Node\\app.js'))
            return 'echo "Not processing Metadata"';
          return 'cd ..\\Libraries\\SN.withSIX.UpdateBreeze.Node && node app.js';
        }
      },
      toast: {
        // Target
        command: function(greeting) {
          return 'cd /D C:\\tools\\toast && toast.exe -t "Ran Grunt" -m "' + greeting + '"';
        }
      },
      bower: {
        command: 'bower prune && bower install --config.interactive=false'
      },
      jspm: {
        command: function() {
          if (!fs.existsSync('..\\buildscripts\\run_jspm.bat'))
            return "jspm install -y";
          return 'cd ..\\buildscripts && run_jspm.bat';
        }
      }
    },

    ngtemplates: {
      Components: {
        cwd: 'src_legacy/app',
        src: 'components/**/*.html',
        dest: 'dist_legacy/app/components/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppPlayTemplates: {
        cwd: 'src_legacy/app',
        src: 'play/**/*.html',
        dest: 'dist_legacy/app/play/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppConnectTemplates: {
        cwd: 'src_legacy/app',
        src: 'connect/**/*.html',
        dest: 'dist_legacy/app/connect/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppAuthTemplates: {
        cwd: 'src_legacy/app',
        src: 'auth/**/*.html',
        dest: 'dist_legacy/app/auth/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppMainTemplates: {
        cwd: 'src_legacy/app',
        src: 'main/**/*.html',
        dest: 'dist_legacy/app/main/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppKbTemplates: {
        cwd: 'src_legacy/app',
        src: 'kb/**/*.html',
        dest: 'dist_legacy/app/kb/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      MyAppAdminTemplates: {
        cwd: 'src_legacy/app',
        src: 'admin/**/*.html',
        dest: 'dist_legacy/app/admin/template.js',
        options: {
          prefix: '/src_legacy/app',
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        }
      },
      bower: {
        cwd: 'bower_components/angular-ui-bootstrap',
        src: 'template/**/*.html',
        dest: 'dist_legacy/bower-template.js',
        options: {
          module: 'ui.bootstrap.tabs'
        }
      }
    },
    bower_concat: {
      all: {
        dest: 'dist_legacy/bower.js',
        mainFiles: {
          'angular-ui': ['build/angular-ui.js'],
          'breezejs': ['breeze.debug.js', 'labs/breeze.angular.js', 'labs/breeze.metadata-helper.js', 'labs/breeze.directives.js', 'labs/breeze.getEntityGraph.js', 'labs/breeze.saveErrorExtensions.js'],
          'ng-tags-input': ['ng-tags-input.js'],
          'angular-ui-bootstrap': ['src/tabs/tabs.js'],
          'ngmap': [''],
          'allmighty-autocomplete': ['script/autocomplete.js'],
          'ng-flags': ['src/directives/ng-flags.js'],
          'angular-rangeslider': ['angular.rangeSlider.js'],
          'angular_progress': ['compiled/angular_progress.js'],
          'angular-rx': ['dist/rx.angular.js'],
          'rxjs': ['dist/rx.all.js'],
          'underscore.string': ['lib/underscore.string.js'],
          'redactor': ['redactor/redactor.js']
        },
        dependencies: {
          'angular': ['jquery'],
          'angular-bootstrap': ['bootstrap-sass-xl'],
          'angular-strap': ['bootstrap-sass-xl'],
          'bootstrap-additions': ['bootstrap-sass-xl'],
          'typeahead.js': ['jquery'],
          'autofill-event': ['angular'],
          'signalr': ['jquery'],
          'jquery-colorbox': ['jquery'],
          'jquery-cookie': ['jquery'],
          'jquery-timeago': ['jquery']
        },
        exclude: [
          'bootstrap',
          'bootstrap-sass-official',
          'compass-mixins',
          'angular-motion',
          'bootstrap-additions',
          'zeroclipboard'
        ]
      }
    },
    // typescript: {
    //     base: {
    //         src: ['**/*.ts'],
    //         //dest: 'where/you/want/your/js/files',
    //         options: {
    //             //module: 'amd', //or commonjs
    //             target: 'es5', //or es3
    //             //basePath: 'cdn',
    //             sourceMap: false,
    //             declaration: false,
    //         }
    //     }
    // },
    uglify: {
      bower: {
        options: {
          mangle: true,
          compress: false, // d3 incompatibility
          sourceMap: true
        },
        files: {
          'dist_legacy/bower.min.js': [
            'dist_legacy/bower.js', 'dist_legacy/bower-template.js'
          ]
        }
      },
      libs: {
        options: {
          mangle: true,
          compress: false, // d3 incompatibility
          sourceMap: true
        },
        files: {
          'dist_legacy/vendor.min.js': [
            'src_legacy/vendor/js/**/*.js' //,
            //'node_modules/babel-polyfill/browser.js' // So that we may use the polyfill also throughout legacy code?
          ]
        }
      },
      app: {
        options: {
          mangle: true,
          compress: {},
          sourceMap: true
        },
        files: {
          // TODO: Unclusterf*ck
          'dist_legacy/app.min.js': [
            'dist_legacy/app/_base/**/*.js',
            'dist_legacy/app/app.js',
            'dist_legacy/app/*.js',
            'dist_legacy/app/components/*.js',
            'dist_legacy/app/components/**/*.js',
            'dist_legacy/app/main/*.js',
            'dist_legacy/app/main/**/*.js',
            'dist_legacy/app/auth/*.js',
            'dist_legacy/app/auth/**/*.js',
            'dist_legacy/app/connect/*.js',
            'dist_legacy/app/connect/**/*.js',
            'dist_legacy/app/play/*.js',
            'dist_legacy/app/play/**/*.js',
            'dist_legacy/app/kb/*.js',
            'dist_legacy/app/kb/**/*.js'
          ]
        }
      },
      admin: {
        options: {
          mangle: true,
          compress: {},
          sourceMap: true
        },
        files: {
          'dist_legacy/admin.min.js': [
            'dist_legacy/app/admin/*.js',
            'dist_legacy/app/admin/**/*.js'
          ]
        }
      },
      misc: {
        options: {
          mangle: true,
          compress: {},
          sourceMap: true
        },
        files: {
          'dist_legacy/misc.min.js': ['dist_legacy/misc/*.js']
        }
      }
    }
  });

  // For publishing
  grunt.registerTask('buildallPublish', ['buildBase', 'uglify:bower', 'ngtemplates', 'buildApp']);
  // For development
  grunt.registerTask('watchAll', ['buildall', 'bgShell:watchGulp', 'watch']);
  grunt.registerTask('metadata', ['shell:prepare', 'shell:build_metadata'])
    // General
  grunt.registerTask('buildall', ['buildBase', 'metadata']);
  grunt.registerTask('buildBase', ['shell:bower', 'bower_concat', 'uglify:libs'])
  grunt.registerTask('buildApp', ['uglify:app']); // 'uglify:misc', 'uglify:admin'
}
