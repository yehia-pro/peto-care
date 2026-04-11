const http = require('http');
http.get('http://127.0.0.1:4000/uploads/1775248981374-61b7M6GpL6L._AC_SX300_SY300_QL70_ML2_.jpg', (res) => {
    console.log('Status Code:', res.statusCode);
    res.resume();
}).on('error', (err) => {
    console.error('Error:', err.message);
});
