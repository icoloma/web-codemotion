// For more information on how to configure a task runner, please visit:
// https://github.com/gulpjs/gulp

var gulp    = require('gulp');
var gutil   = require('gulp-util');
var gulpif  = require('gulp-if');
var clean   = require('gulp-clean');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var jshint  = require('gulp-jshint');
var uglify  = require('gulp-uglify');
var sass    = require('gulp-sass');
var csso    = require('gulp-csso');

var es      = require('event-stream');
var http    = require('http');
var browserify = require('gulp-browserify');
var sprite = require('css-sprite').stream;

gulp.task('clean', function () {
  // Clear the destination folder
  gulp.src('dist/**/*.*', { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('copy-html', function () {
  return gulp.src('./src/**/*.html', { base: './src' })
      .pipe(gulp.dest('./dist'));

});

gulp.task('copy', ['copy-html'], function () {
  // Copy all application files except *.less and .js into the `dist` folder
  return es.concat(
    gulp.src(['src/scss/fontello/**'])
      .pipe(gulp.dest('dist/css/fontello')),
    gulp.src(['src/scss/opensans/**'])
      .pipe(gulp.dest('dist/css/opensans')),
    gulp.src(['src/img/**'])
      .pipe(gulp.dest('dist/img')),
    gulp.src(['src/js/vendor/**'])
      .pipe(gulp.dest('dist/js/vendor')),
    gulp.src(['src/*.*', 'src/CNAME'])
      .pipe(gulp.dest('dist'))
  );
});

gulp.task('scripts', function () {
  return es.concat(
    // Detect errors and potential problems in your JavaScript code
    // You can enable or disable default JSHint options in the .jshintrc file
    gulp.src(['src/js/**/*.js', '!src/js/vendor/**'])
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter(require('jshint-stylish'))),

    // Concatenate, minify and copy all JavaScript (except vendor scripts)
    /*
    gulp.src(['src/js/** 
    /*.js', '!src/js/vendor/**'])
      .pipe(concat('app.js'))
      .pipe(uglify())
      .pipe(gulp.dest('dist/js'))
    */
    gulp.src('src/js/app.js')
      .pipe(browserify({
        insertGlobals: true,
        debug: false // true
      }))
      //.pipe(uglify())
      .pipe(gulp.dest('./dist/js')) // pipe it to the output DIR
  );
});

gulp.task('sprites', function () {
  return gulp.src('./src/img/communities/gray/*.png')
      .pipe(sprite({
        name: 'communities.png',
        style: '_sprite.scss',
        cssPath: '/img/communities/',
        processor: 'scss',
        prefix: 'community',
        retina: true
      }))
      .pipe(gulpif('*.png', gulp.dest('./src/img/communities/')))
      .pipe(gulpif('*.scss', gulp.dest('./src/scss/')));
});

gulp.task('styles', function () {
  return gulp.src('src/scss/app.scss')
      .pipe(sass())
      .pipe(rename('app.css'))
      .pipe(csso())
      .pipe(gulp.dest('dist/css'))
});

gulp.task('watch', function () {
  // Watch .js files and run tasks if they change
  gulp.watch('src/js/**/*.js', ['scripts']);

  // Watch .less files and run tasks if they change
  gulp.watch('src/scss/**/*.scss', ['styles']);

  // Watch .html files
  gulp.watch('./src/**/*.html', ['copy-html']);
});

// The dist task (used to store all files that will go to the server)
gulp.task('dist', ['clean', 'copy', 'scripts', 'sprites', 'styles']);

// The default task (called when you run `gulp`)
gulp.task('default', ['dist', 'watch']);
