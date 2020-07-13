const { src, dest, series, parallel, task, watch, lastRun } = require('gulp')
const clean        = require('gulp-clean')
const prettify     = require('gulp-prettify')
const sass         = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const babel        = require('gulp-babel');
const plumber      = require('gulp-plumber')
const sourcemaps   = require('gulp-sourcemaps')
const changed      = require('gulp-changed')
const imagemin     = require('gulp-imagemin')
const imageminJpg  = require('imagemin-jpeg-recompress')
const imageminPng  = require('imagemin-pngquant')
const imageminGif  = require('imagemin-gifsicle')
const svgmin       = require('gulp-svgmin')
const concat       = require('gulp-concat')
const rename       = require('gulp-rename')
const uglify       = require('gulp-uglify')
const browserSync  = require('browser-sync').create();
const root         = './htdocs/'
const assets       = root + 'assets/'
const work         = './work/'
const option       = {
	port: 8000,
	server: {
		baseDir: root,
		index: 'index.html',
	},
	reloadOnRestart: true
}

function cleanFile(){
	return src([assets + 'js/*',assets + 'css/*']).pipe(clean())
}

function html(){
	return src(work + 'views/**/*.html' , {
			since: lastRun(html)
		})
		.pipe(
			prettify({
				indent_char: '	',
				indent_size: 1,
				unformatted: ['a', 'span', 'br'],
			})
		)
		.pipe(dest('./htdocs/'))
}

function stylesheet(){
	return src(work + 'sass/**/*.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				outputStyle: 'expanded'
			})
		)
		.pipe(autoprefixer({
			browsers: ['last 2 version', 'iOS >= 8.1', 'Android >= 4.4'],
				cascade: false
			})
		)
		.pipe(sourcemaps.write())
		.pipe(dest(assets + 'css/',{sourcemaps:'./maps'}))
}

function javascript(){
	return src(work + 'js/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat('script.js'))
		.pipe(babel({ presets: ['@babel/env'] }))
		.pipe(plumber())
		.pipe(uglify())
		.pipe(
			rename({
				suffix: '.min'
			})
		)
		.pipe(dest(assets + 'js',{sourcemaps:'./maps'}))
}

function image(){
	return src(work + 'images/**/*.+(jp?eg|png|gif|svg)')
		.pipe(changed('./images'))
		.pipe(imagemin([
			imagemin.svgo({
				removeViewBox: false,
			}),
			imageminPng({
				quality: [0.7, 0.85],
			}),
			imageminJpg(),
			imageminGif({
				interlaced: false,
				optimizationLevel: 3,
				colors: 180
			})
		]))
		.pipe(dest(assets + 'images/'))
}

function browsersync(done){
	browserSync.init(option)
	done()
}

function watchFiles(done) {
	const browserReload = () => {
		browserSync.reload()
		done()
	}
	watch(work + 'sass/**/*.scss').on('change', series(stylesheet, browserReload))
	watch(work + 'js/**/*.js').on('change', series(javascript, browserReload))
	watch(work + 'views/**/*.html').on('change', series(html, browserReload))
}
exports.default = series(cleanFile, parallel(javascript, stylesheet, html), browsersync, watchFiles)

task('clean', cleanFile)
task('sass-compress', stylesheet)
task('js-compress', javascript)
task('imagemin', image)
task('build', series(parallel(javascript, image, stylesheet, html), cleanFile))
