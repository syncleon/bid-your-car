const http = require('http');

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/items',
    method: 'GET'
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            console.log('Status:', res.statusCode);
            console.log('Body:', JSON.parse(data));
        } catch (e) {
            console.log('Body:', data);
        }
    });
});
req.on('error', e => console.error(e));
req.end();
