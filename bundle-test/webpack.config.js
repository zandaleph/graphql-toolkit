const path = require('path');

module.exports = {
    mode: 'production',
    output: {
        filename: 'index.js'
    },
    resolve: {
        alias: {
            'graphql-toolkit': path.join(__dirname, '..')
        },
        modules: ['node_modules', '../node_modules']
    }
}