const gulp = require('gulp')
const uglify = require('gulp-uglify-es').default
const htmlmin = require('gulp-htmlmin')
const rename = require('gulp-rename')

gulp.task('uglify', () => {
	return gulp.src('script.js', { allowEmpty: true })
		.pipe(rename('script.min.js'))
		.pipe(uglify({
			compress: { drop_console: true }
		}))
		.pipe(gulp.dest('.'))
})

gulp.task('minifyHTML', () => {
	return gulp.src('api.html', { allowEmpty: true })
		.pipe(rename('api.min.html'))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			trimCustomFragments: true
		}))
		.pipe(gulp.dest('.'))
})

gulp.task('default', gulp.series(
	gulp.parallel(
		'uglify',
		'minifyHTML'
	)
))