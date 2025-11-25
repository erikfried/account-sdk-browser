export default {
    testURL: 'http://spid.no',
    testPathIgnorePatterns: [
        '/node_modules/',
        '__tests__/utils.js',
    ],
    moduleFileExtensions: ['js', 'ts', 'json'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.(js|ts)$': 'babel-jest',
    },
};
