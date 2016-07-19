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
        dest: 'legacy/app/components/template.js',
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
        dest: 'legacy/app/play/template.js',
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
        dest: 'legacy/app/connect/template.js',
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
        dest: 'legacy/app/auth/template.js',
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
        dest: 'legacy/app/main/template.js',
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
        dest: 'legacy/app/kb/template.js',
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
        dest: 'legacy/app/admin/template.js',
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
        dest: 'legacy/bower-template.js',
        options: {
          module: 'ui.bootstrap.tabs'
        }
      }
    },
    bower_concat: {
      all: {
        dest: 'legacy/bower.js',
        mainFiles: {
          'angular-ui': ['build/angular-ui.js'],
          'breezejs': ['breeze.debug.js', 'labs/breeze.angular.js', 'labs/breeze.metadata-helper.js', 'labs/breeze.directives.js', 'labs/breeze.getEntityGraph.js', 'labs/breeze.saveErrorExtensions.js'],
          'ng-tags-input': ['ng-tags-input.js'],
          'angular-ui-bootstrap': ['src/tabs/tabs.js'],
          'allmighty-autocomplete': ['script/autocomplete.js'],
          'ng-flags': ['src/directives/ng-flags.js'],
          'angular-rangeslider': ['angular.rangeSlider.js'],
          'angular_progress': ['compiled/angular_progress.js'],
          'angular-rx': ['dist/rx.angular.js'],
		  'jquery-migrate': ['jquery-migrate.min.js'],
          'rxjs': ['dist/rx.all.js'],
          'underscore.string': ['lib/underscore.string.js'],
          'redactor': ['redactor/redactor.js']
        },
        dependencies: {
          'angular': ['jquery-migrate'],
          'angular-bootstrap': ['bootstrap-sass-xl'],
          'angular-strap': ['bootstrap-sass-xl'],
          'bootstrap-additions': ['bootstrap-sass-xl'],
          'typeahead.js': ['jquery-migrate'],
          'autofill-event': ['angular'],
          'signalr': ['jquery-migrate'],
	  'jquery-migrate': ['jquery']
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
    uglify: {
      bower: {
        options: {
          mangle: true,
          compress: false, // d3 incompatibility
          sourceMap: false
        },
        files: {
          'legacy/bower.min.js': [
            'legacy/bower.js', 'legacy/bower-template.js'
          ]
        }
      },
      libs: {
        options: {
          mangle: true,
          compress: false, // d3 incompatibility
          sourceMap: false
        },
        files: {
          'legacy/vendor.min.js': [
            'src_legacy/vendor/js/**/*.js'
          ]
        }
      },
      app: {
        options: {
          mangle: true,
          compress: {},
          sourceMap: false
        },
        files: {
          'legacy/app.min.js': [
            'legacy/app/_base/**/*.js',
            'legacy/app/app.js',
            'legacy/app/*.js',
            'legacy/app/components/*.js',
            'legacy/app/components/**/*.js',
            'legacy/app/main/*.js',
            'legacy/app/main/**/*.js',
            'legacy/app/auth/*.js',
            'legacy/app/auth/**/*.js',
            'legacy/app/connect/*.js',
            'legacy/app/connect/**/*.js',
            'legacy/app/play/*.js',
            'legacy/app/play/**/*.js',
            'legacy/app/kb/*.js',
            'legacy/app/kb/**/*.js'
          ]
        }
      }
    }
  });

  // For publishing
  grunt.registerTask('buildallPublish', ['buildBase', 'uglify:bower', 'ngtemplates', 'buildApp']);
  // For development
  grunt.registerTask('watchAll', ['buildall', 'bgShell:watchGulp', 'watch']);
  grunt.registerTask('metadata', ['shell:build_metadata'])
    // General
  grunt.registerTask('buildall', ['buildBase', 'metadata']);
  grunt.registerTask('buildBase', ['shell:bower', 'bower_concat', 'uglify:libs'])
  grunt.registerTask('buildApp', ['uglify:app']);
}
