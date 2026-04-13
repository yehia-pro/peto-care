const express = require('express');
const { requireAuth } = require('./src/middleware/auth');
const adminRoutes = require('./src/routes/admin').default;

const app = express();
app.use('/api/admin', adminRoutes);

console.log("Registered routes in adminRoutes:");
adminRoutes.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(Object.keys(r.route.methods).join(', ').toUpperCase() + " " + r.route.path);
    }
});
