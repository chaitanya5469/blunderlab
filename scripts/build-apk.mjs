// Builds the debug APK (run `npm run android:sync` first, or use `npm run android:apk`).
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'android');
const win = process.platform === 'win32';
const run = (args) => spawnSync(join(dir, win ? 'gradlew.bat' : 'gradlew'), args, { cwd: dir, stdio: 'inherit', shell: win });

const build = run(['assembleDebug']);
run(['--stop']); // don't leave a Gradle daemon running
if (build.status !== 0) process.exit(build.status ?? 1);

const apk = join(dir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
console.log(`\nAPK: ${apk} (${(statSync(apk).size / 1048576).toFixed(1)} MB)`);
