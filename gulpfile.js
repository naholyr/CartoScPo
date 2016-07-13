var gulp = require('gulp'),
    server = require('gulp-server-livereload'),
    connect = require('gulp-connect'),
    sass = require('gulp-sass'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    browserSync = require('browser-sync').create();
    //eslint = require('gulp-eslint');
 
// Concat all bower libraries used in website
gulp.task('js', function() {
    return gulp.src([
      'bower_components/jquery-highlight/jquery-highlight.js',
      'bower_components/lodash/dist/lodash.min.js',
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/jquery-ui/ui/minified/jquery-ui.min.js',
      'bower_components/angular/angular.js',
      'bower_components/leaflet/dist/leaflet.js',
      'bower_components/angular-simple-logger/dist/angular-simple-logger.js',
      'bower_components/ui-leaflet/dist/ui-leaflet.min.js',
      'bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.js',
      'bower_components/bootstrap/dist/js/bootstrap.min.js',
      'bower_components/angular-route/angular-route.min.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
      'bower_components/angular-ui-select/dist/select.js',
      'bower_components/ng-grid/build/ng-grid.js',
      'bower_components/ng-grid/plugins/ng-grid-csv-export.js',
      'bower_components/angular-loading-bar/build/loading-bar.js',
      'bower_components/angulartics/dist/angulartics.min.js',
      'bower_components/angulartics-google-analytics/dist/angulartics-google-analytics.min.js',
      'bower_components/d3/d3.min.js',
      'bower_components/papaparse/papaparse/min.js',
      'bower_components/elasticlunr.js/elasticlunr.js',
      'bower_components/showdown/src/showdown.js',
      'bower_components/angular-ui-grid/ui-grid.js',
      'bower_components/angular-touch/angular-touch.min.js',
      'bower_components/jquery.scrollTo/jquery.scrollTo.min.js',
      'app/lib/leaflet.markercluster.js'
      ],
      {base: 'bower_components/'}
    )
    .pipe(concat('all.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./app/assets/js/'));
});

// Concat all css used in website
gulp.task('css', function() {
    return gulp.src([
        'bower_components/angular-ui-select/dist/select.css',
        'bower_components/ng-grid/ng-grid.css',
        'bower_components/angular-loading-bar/build/loading-bar.css',
        //'bower_components/leaflet/dist/leaflet.css',
        'bower_components/angular-ui-grid/ui-grid.css'
      ],
      {base: 'bower_components/'}
    )
    .pipe(concat('allcss.css'))
    // .pipe(uglify())
    .pipe(gulp.dest('./app/assets/css/'));
});

// gulp.task('sass', function() {
//     return gulp.src('app/style/*.scss')
//         .pipe(sass())
//         .pipe(gulp.dest('./app/assets/css'))
//         .pipe(browserSync.stream());
// });

// gulp.task('lint', function() {
//     // ESLint ignores files with "node_modules" paths. 
//     // So, it's best to have gulp ignore the directory as well. 
//     // Also, Be sure to return the stream from the task; 
//     // Otherwise, the task may end before the stream has finished. 
//     return gulp.src(['app/*.js', 'app/**/*.js', '!app/assets/**', '!app/lib/**'])
//         // eslint() attaches the lint output to the "eslint" property 
//         // of the file object so it can be used by other modules. 
//         .pipe(eslint({
//               rules: {
//                 'quotes': ["error", "single"],
//                 'eqeqeq': ["error", "allow-null"],
//                 'curly': ["error", "multi", "consistent"],
//                 'no-console': "error",
//                 'no-extra-semi': "error",
//                 'no-negated-in-lhs': "error",
//                 'no-irregular-whitespace': "error"
//                 //"indent": ["error", 4]
//             }
//         }))
//         // eslint.format() outputs the lint results to the console. 
//         // Alternatively use eslint.formatEach() (see Docs). 
//         .pipe(eslint.format())
//         // To have the process exit with an error code (1) on 
//         // lint error, return the stream and pipe to failAfterError last. 
//         .pipe(eslint.failAfterError());
// });

gulp.task('less', function() {
    return gulp.src('./app/style/*.less')
        .pipe(less())
        .pipe(gulp.dest('./app/assets/css'))
        .pipe(browserSync.stream());
});

// Launch server with livereload
gulp.task('serve', function() {
    browserSync.init({ server: "./app" });

    //gulp.watch('./app/assets/scss/*.scss', ['sass']);
    gulp.watch('app/style/*.less').on('change', browserSync.reload);
    gulp.watch(['app/*.js', 'app/**/*js']).on('change', browserSync.reload);
    gulp.watch('app/views/*.html').on('change', browserSync.reload);
});

gulp.task('prod', function() {
   return gulp.src(['app/app.js', 'app/controllers/*.js', 'app/services/*.js', 'app/directives/*.js'])
    .pipe(concat('app.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('./app/assets/js'))
})

// Default task that launch concat js, css & less then launch server
gulp.task('default', ['js', 'css', 'less', 'serve']);