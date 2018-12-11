const config       = require('./config.js')

const express      = require('express');
const bodyParser   = require('body-parser');
const fileUpload   = require('express-fileupload');

const app = express();

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/public'));
require('./routes/videoRoutes.js')(app, config.videoDir);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Listening on port: " + port));