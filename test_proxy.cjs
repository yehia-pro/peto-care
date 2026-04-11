const http = require('http');

const testUrlFrontend = "http://localhost:5173/uploads/1775250659504-61b7M6GpL6L._AC_SX300_SY300_QL70_ML2_.jpg";

console.log('Testing Frontend Proxy...');
const req = http.get(testUrlFrontend, fRes => {
    console.log('Frontend Status:', fRes.statusCode);
    console.log('Headers:', fRes.headers);
    fRes.resume();
});
req.on('error', e => console.error('Frontend Fetch Error:', e.message));
