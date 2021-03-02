const fs = require('fs');

const outputLogFile = './logs/logs.txt';

module.exports = (message) => {
    fs.appendFileSync(outputLogFile, `[${new Date().toLocaleString()}] - ${message}\n`, { encoding: 'utf-8' });
}