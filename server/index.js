const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://54.210.168.1:4200');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(express.static(path.resolve(__dirname, '..', 'dist')));
app.use(express.static(path.resolve(__dirname, '..', 'node_modules')));
app.use((err, req, res, next) => {
  console.error(err);
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || 'Internal server error.');
});
app.get('*', function (request, response) {
  response.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'))
});
app.listen(process.env.PORT || 4200, () => {
  console.log("server running on 4200");
});
