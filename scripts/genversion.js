import assert from 'node:assert';
import { writeFileSync } from 'fs';

// eslint-disable-next-line no-undef
const version = process.env.npm_package_version;
assert.match(version, /^\d+\.\d+\.\d+(-\w+)?$/, `Version '${version}' is not valid`);

// eslint-disable-next-line no-undef
const filename = `${ process.cwd() }/src/version.ts`;
const content = `// Automatically generated in 'npm version' by scripts/genversion.js

const version = '${ version }';
export default version;
`;

writeFileSync(filename, content, 'utf8');
