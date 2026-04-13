const https = require('https');

const postData = JSON.stringify({
  email: 'demo_store@example.local',
  password: '123456'
});

const req = https.request({
  hostname: 'yehia-ayman-peto-care-server.hf.space',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('LOGIN STATUS:', res.statusCode);
    const result = JSON.parse(data);
    if (!result.token) return console.log('FAILED TO GET TOKEN', result);

    console.log('Got token, fetching profile...');
    const profileReq = https.request({
      hostname: 'yehia-ayman-peto-care-server.hf.space',
      port: 443,
      path: '/api/petstores/profile',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + result.token
      }
    }, (pRes) => {
      let pData = '';
      pRes.on('data', (c) => pData += c);
      pRes.on('end', () => {
        console.log('PROFILE STATUS:', pRes.statusCode);
        console.log('PROFILE BODY:', pData);
      });
    });
    profileReq.end();
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
