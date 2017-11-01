const gulp = require('gulp')
const blok = require('gulp-blok')
const watch = require('gulp-watch')
const sass = require('gulp-sass')
const sassGlob = require('gulp-sass-glob')
const browserSync = require('browser-sync')
const reload = browserSync.reload
const config = require('./config.js')
const rename = require('gulp-rename')
const exec = require('child_process').exec
const portfinder = require('portfinder')

gulp.task('templates:cleanup', function (cb) {
  config.blok.environment = 'live'

  exec('storyblok delete-templates --space=' + config.blok.themeId + ' --env=' + config.blok.environment, function (err, stdout, stderr) {
    console.log(stdout)
    console.log(stderr)
    cb(err)
  })
})

gulp.task('deploy:dev', function () {
  return gulp.src('./views/**/*')
    .pipe(blok(config.blok))
})

gulp.task('deploy:live', function () {
  config.blok.environment = 'live'

  return gulp.src('./views/**/*')
    .pipe(blok(config.blok))
})

gulp.task('styles:below', function () {
  return gulp.src('source/scss/below.scss')
    .pipe(sassGlob())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./views/assets/css/'))
    .pipe(browserSync.stream())
})

gulp.task('styles:above', function () {
  return gulp.src('source/scss/above.scss')
    .pipe(sassGlob())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./views/assets/css/'))
    .pipe(browserSync.stream())
    .pipe(rename('_above_fold_css.liquid'))
    .pipe(gulp.dest('./views/components/'))
})

gulp.task('vendor:scripts', function () {
  return gulp.src('source/js/vendor/*')
    .pipe(gulp.dest('views/assets/js/vendor'))
})

gulp.task('browsersync', function () {
  portfinder.getPort({port: 4440}, function (err, port) {

    console.log('Your project will be running on: localhost:' + port)

    if (port != 4440) {
      throw new Error('Address with port 4440 is already in use. Be sure to stop other services or Storyblok projects running on this port.')
    }

    browserSync({
      port: 4440,
      serveStatic: ['./views'],
      proxy: {
        target: 'http://' + config.blok.domain,
        reqHeaders: function () {
          return {
            'accept-encoding': 'identity',
            'agent': false,
            'browsersyncblok': true,
            'storyblokenv': config.blok.environment
          }
        }
      },
      reloadDelay: 500,
      notify: true,
      open: true,
      logLevel: 'silent'
    })
  })

  gulp.watch(['source/scss/_variables.scss'], ['styles:above', 'styles:below'])
  gulp.watch(['source/scss/above.scss', 'source/scss/components/above/**/*.scss', 'source/scss/components/elements/**/*.scss'], ['styles:above'])
  gulp.watch(['source/scss/below.scss', 'source/scss/components/below/**/*.scss'], ['styles:below'])
  gulp.watch('source/js/vendor/*.js', ['vendor:scripts'])
  gulp.watch('views/assets/js/**/*.js', function(event) {
    browserSync.reload()
  })
})

gulp.task('build', ['styles:above', 'styles:below'])

gulp.task('default', ['build', 'browsersync'], function () {
  return watch('./views/**/*')
    .pipe(blok(config.blok))
})
