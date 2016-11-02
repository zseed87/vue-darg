var gulp = require('gulp'),
	autoprefixer = require('gulp-autoprefixer'),	//增加私有变量前缀
	minifycss = require('gulp-clean-css'),			//压缩css
	babel    = require("gulp-babel"),				//babel
	uglify = require('gulp-uglify'),				//压缩js
	browserSync = require('browser-sync').create(),
	reload      = browserSync.reload,				//浏览器自动刷新
	del = require('del');							//也是个删除···

var sourcePath = {									//源文件路径
		all: 'src/**/*',
		css: 'src/css/**/*.css',
		js: 'src/js/*.js'
	},
	destinationPath = {								//目的文件路径
		css: 'dist/css/',
		js: 'dist/js/'
	},
	uglifyOpt =
		{
			mangle: {
	            except: ['require', 'exports', 'module', 'Vue']
	        },
	        compress: {
	        	sequences: true,
		        dead_code: true,
		        conditionals: true,
		        booleans: true,
		        unused: true,
		        if_return: true,
		        join_vars: true,
		        drop_console: true,
	        	warnings: false
	        }
		};											//压缩参数

/*压缩css*/
gulp.task('css', function(){
	return gulp.src(sourcePath.css)
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
		.pipe(minifycss())							//压缩
		.pipe(gulp.dest(destinationPath.css))
		.pipe(reload({stream: true}));
});

/*压缩js并生成版本号*/
gulp.task('js', function(){
	return gulp.src(sourcePath.js)
		.pipe(babel({
        	presets: ['es2015']
       	}))
		.pipe(uglify(uglifyOpt))						//压缩
		.pipe(gulp.dest(destinationPath.js));
});

//清空dist
gulp.task('clean', function(cb){
	del([destinationPath.js, destinationPath.css], cb);
});

//生成dist
gulp.task('default', ['clean'], function(){
	runSequence('js', 'css');
});

gulp.task('watch', function(){
	gulp.watch(sourcePath.js, ['js']);
	gulp.watch(sourcePath.css, ['css']);

    browserSync.init({
        server: {
            baseDir: "src/"
        }
    });

    gulp.watch("**/*").on("change", browserSync.reload);
});

