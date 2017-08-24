var gulp         = require('gulp');
var gulpSequence = require('gulp-sequence');
require('./task/gulp.js');

gulp.task('dev', gulpSequence('clean','webpack','replace', 'replacejs', 'upload'));
gulp.task('prod', gulpSequence('clean','webpack','replace', 'replacejs', 'upload'));

gulp.task('noqiniu-dev', gulpSequence('clean','webpack','replace', 'replacejs'));
gulp.task('noqiniu-prod', gulpSequence('clean','webpack','replace', 'replacejs'));
gulp.task('git.start',gulpSequence('createDist','cleanDist','init','checkout','remote','pull'));
gulp.task('git.end',gulpSequence('add','commit','push'));