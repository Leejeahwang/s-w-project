const express = require('express');
const app = express();
const routes = require('./routes');
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(routes);
// const { initializeDatabase } = require('./db');
// initializeDatabase();

app.listen(3000, () => console.log('Server running on http://localhost:3000'));