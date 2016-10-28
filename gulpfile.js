var gulp = require('gulp');
var childProcess = require('child_process');
var mocha = require('gulp-mocha');
var join = require('path').join;
var fs = require('fs');
var path = require('path');
var istanbul = require('gulp-istanbul');


var testFiles = [
    'dist/test/structure_suite.js'
]

gulp.task('pre-test', function () {
    return gulp.src([
        'dist/*.js',
        'dist/structure/**/*.js'
    ])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
    global.isExpanded = null;

    return gulp.src(testFiles, { read: false })
        .pipe(mocha({
            bail: true,
            reporter: 'spec'
        }))
        .pipe(istanbul.writeReports());
});