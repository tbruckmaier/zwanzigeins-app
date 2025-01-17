const
  	gulp = require('gulp'),
  	rollup = require('gulp-better-rollup'),
  	uglify = require('rollup-plugin-uglify-es'),
  	uglifycss = require('gulp-uglifycss'),
  	GulpSSH = require('gulp-ssh'),
  	shell = require('shelljs'),
  	fs = require('fs'),
  	os = require('os'),
	revAll = require('gulp-rev-all')
  	;

const 
	stagePath = 'build/stage',
	distPath = 'build/dist'
	;
  	
gulp.task('build-js', () => {
	
	return gulp.src('js/zwanzigeins-app.js')
		.pipe(rollup({plugins:[uglify()]}, 'iife'))
		.pipe(gulp.dest('build/stage/js'));
});

gulp.task('build-css', () => {

	return gulp.src(['css/*', '!css/debug-tools.css'])
		.pipe(uglifycss())
		.pipe(gulp.dest('build/stage/css'));
});

gulp.task('copy-images-to-stage', () => {
	
	return gulp.src('img/**/*')
		.pipe(gulp.dest(stagePath + '/img'));
});

gulp.task('copy-other-to-stage', () => {
	
	return gulp.src('web-manifest.json')
		.pipe(gulp.dest(stagePath));
});

gulp.task('rev-all', () => {
	
	return gulp.src(stagePath + '/**/*')
		.pipe(revAll.revision({ includeFilesInManifest: ['.css', '.js', '.png', '.svg', '.html'] }))
		.pipe(gulp.dest(distPath))
		.pipe(revAll.manifestFile())
		.pipe(gulp.dest(stagePath))
		;
});

gulp.task('copy-debug-resources', ready => {
	
	shell.cp('js/debug-tools.js', distPath + '/js');
	shell.cp('css/debug-tools.css', distPath + '/css');
	
	ready();
});

gulp.task('build-html', ready => {

	let html = fs.readFileSync('zwanzigeins-app.html', 'utf8');
	
	html = html.replace(' type="module"', '');
	
	shell.mkdir('-p', stagePath);
	
	fs.writeFileSync(stagePath + '/index.html', html, 'utf8');
	
	ready();
});

gulp.task('build-service-worker', ready => {
	
	let manifestPath = stagePath + '/rev-manifest.json';
	
	let manifestJson = fs.readFileSync(manifestPath);
	let manifest = JSON.parse(manifestJson);
	
	let cacheManifest = { urls: [], endpoints: [] };
	
	for(let srcItem in manifest){
		
		let resourcePath = manifest[srcItem];
		
		if(srcItem == 'index.html'){
			
			shell.mv(distPath + '/' + resourcePath, distPath + '/index.html');
			
			let checksum = resourcePath.substr('index.'.length, 8);
			let endpoint = {url: 'index.html', checksum: checksum};
			cacheManifest.endpoints.push(endpoint);
		}	
		else{
			cacheManifest.urls.push(resourcePath);
		}	
	}
	
	let cacheManifestJson = JSON.stringify(cacheManifest, null, 4);
	
	let serviceWorkerContent = fs.readFileSync('service-worker.js');
	
	let result = serviceWorkerContent + '\ncacheManifest = ' + cacheManifestJson
	
	fs.writeFileSync(distPath + '/service-worker.js', result, 'utf8');
	
	ready();
});

gulp.task('deploy', ready => {
	
	let configJson = fs.readFileSync('deploy-config.json');
	let config = JSON.parse(configJson);
	
	config.privateKey = fs.readFileSync(os.homedir() + '/.ssh/id_rsa');
	
	let gulpSsh = new GulpSSH({
		ignoreErrors: false,
		sshConfig: config
	});
	
	config.destDirs.forEach(destDir =>{
		gulpSsh
			.exec(['rm ' + destDir + '/* -r'], {filePath: 'commands.log'})
			.pipe(gulp.dest('logs'))
	});
	
	config.destDirs.forEach(destDir =>{
		gulp.src(distPath + '/**/*')
		.pipe(gulpSsh.dest(destDir + '/'));
	});
	
	ready();
});

gulp.task('clean', ready => {
	
	shell.rm('-rf', 'build/*');
	ready();
});

gulp.task('default', gulp.series(
	'clean',
	'copy-images-to-stage',
	'copy-other-to-stage',
	'build-js',
	'build-css',
	'build-html',
	'rev-all',
	'build-service-worker',
	'copy-debug-resources',
	), () => {}
);
