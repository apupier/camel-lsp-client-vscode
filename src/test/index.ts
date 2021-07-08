import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

const NYC = require('nyc');

export function run(): Promise<void> {
	const nyc = setupCoverage();

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		timeout: 100000,
		reporter: 'mocha-jenkins-reporter'
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				e(err);
			} finally {
				if (nyc) {
					nyc.writeCoverageFile();
					nyc.report();
				}
			}
		});
	});
}
function setupCoverage() {
	console.log('cwd used: ' + path.join(__dirname, '..', '..', '..'));
	const nyc = new NYC({
		extends: "@istanbuljs/nyc-config-typescript",
		cache: false,
		cwd: path.join(__dirname, '..', '..', '..'),
		exclude: [
			"**/**.test.js"
		],
		extension: [
			".ts"
		],
		reporter: ['text', 'html'],
		instrument: true,
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		require: [
			"ts-node/register",
		],
		sourceMap: true,
		all: true,
		excludeAfterRemap: false
	});

	nyc.reset();
	nyc.wrap();
	return nyc;
}

