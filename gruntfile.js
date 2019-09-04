const fs = require('fs');
const path = require('path');
const { union } = require('./config/lib/util');
const defaultAssets = require('./config/assets/default');
const testAssets = require('./config/assets/test');

module.exports = (grunt) => {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env: {
      test: {
        NODE_ENV: 'test'
      },
      dev: {
        NODE_ENV: 'development'
      },
      prod: {
        NODE_ENV: 'production'
      }
    },
    watch: {
      serverViews: {
        files: defaultAssets.server.views,
        options: {
          livereload: true
        }
      },
      serverJS: {
        files: union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS),
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      clientViews: {
        files: defaultAssets.client.views,
        options: {
          livereload: true
        }
      },
      clientJS: {
        files: defaultAssets.client.js,
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      clientCSS: {
        files: defaultAssets.client.css,
        tasks: ['csslint'],
        options: {
          livereload: true
        }
      },
      clientSCSS: {
        files: defaultAssets.client.sass,
        tasks: ['sass', 'csslint'],
        options: {
          livereload: true
        }
      },
    },
    serv: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--inspect'],
          ext: 'js,html',
          watch: union(defaultAssets.server.gruntConfig, defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
        }
      }
    },
    concurrent: {
      debug: ['node-inspect', 'watch'],
      options: {
        logConcurrentOutput: true
      }
    },
    jshint: {
      all: {
        src: union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS, defaultAssets.client.js, testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e),
        options: {
          jshintrc: true,
          node: true,
          mocha: true,
          jasmine: true
        }
      }
    },
    eslint: {
      options: {},
      target: union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS, defaultAssets.client.js, testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e)
    },
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        src: defaultAssets.client.css
      }
    },
    ngAnnotate: {
      production: {
        files: {
          'public/dist/application.js': defaultAssets.client.js
        }
      }
    },
    uglify: {
      production: {
        options: {
          mangle: false
        },
        files: {
          'public/dist/application.min.js': 'public/dist/application.js'
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'public/dist/application.min.css': defaultAssets.client.css
        }
      }
    },
    sass: {
      dist: {
        files: [{
          expand: true,
          src: defaultAssets.client.sass,
          ext: '.css',
          rename: (base, src) => {
            return src.replace('/scss/', '/css/');
          }
        }]
      }
    },
    copy: {
      localConfig: {
        src: 'config/env/local.example.js',
        dest: 'config/env/local.js',
        filter: () => {
          return !fs.existsSync('config/env/local.js');
        }
      }
    }
  });

  // Load NPM tasks
  require('load-grunt-tasks')(grunt);
  // grunt.loadNpmTasks('grunt-protractor-coverage');

  // Make sure upload directory exists
  grunt.task.registerTask('mkdir:upload', 'Task that makes sure upload directory exists.', () => {
    // Get the callback
    const done = this.async();
    grunt.file.mkdir(path.normalize(__dirname + '/modules/users/client/img/profile/uploads'));
    done();
  });

  // Connect to the MongoDB instance and load the models
  grunt.task.registerTask('mongoose', 'Task that connects to the MongoDB instance and loads the application models.', () => {
    // Get the callback
    const done = this.async();
    // Use mongoose configuration
    const mongoose = require('./config/lib/mongoose.js');
    // Connect to database
    mongoose.connect(() =>{
      done();
    });
  });

  // Drops the MongoDB database, used in e2e testing
  grunt.task.registerTask('dropdb', 'drop the database', () => {
    // async mode
    const done = this.async();
    // Use mongoose configuration
    const mongoose = require('./config/lib/mongoose.js');

    mongoose.connect((db) => {
      db.connection.db.dropDatabase((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully dropped db: ', db.connection.db.databaseName);
        }
        db.connection.db.close(done);
      });
    });
  });

  grunt.task.registerTask('server', 'Starting the server', () => {
    const path = require('path');
    const app = require(path.resolve('./config/lib/app'));
    app.start();
  });

  // Lint CSS and JavaScript files.
  grunt.registerTask('lint', ['sass', 'jshint', 'eslint', 'csslint']);

  // Lint project files and minify them into two production files.
  grunt.registerTask('build', ['env:dev', 'lint', 'ngAnnotate', 'uglify', 'cssmin']);

  // Run the project in development mode
  grunt.registerTask('default', ['env:dev', 'lint', 'mkdir:upload', 'copy:localConfig', 'server']);

  // Run the project in debug mode
  grunt.registerTask('debug', ['env:dev', 'lint', 'mkdir:upload', 'copy:localConfig', 'concurrent:debug']);

  // Run the project in production mode
  grunt.registerTask('prod', ['build', 'env:prod', 'mkdir:upload', 'copy:localConfig', 'server']);
};
