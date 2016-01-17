var express    = require('express')
  , path       = require('path')
  , logger     = require('morgan')
  , bodyParser = require('body-parser')
  , mailer     = require('express-mailer')
  , config     = require('./config');

// Initialize the app
var app = express();

// Configure our mailer with the config object
mailer.extend(app, config.mailer);

// Configure the views directory and engine. These are used by the mailer
app.set('views', path.join(__dirname, config.viewsDir));
app.set('view engine', config.viewEngine);

// Configure the logger
app.use(logger(config.logger));

// Set the codyParser to JSON (because that's what we want to output)
app.use(bodyParser.json());

// Set default headers for all requests and respond to all OPTIONS requests with 200
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS')
    res.status(200).end()
  else
    next()
});

// Requests to the login page should be validated
app.post(path.join(config.publicPrefix, '/login'),
  require('./middlewares/auth').validateRequestWithPassword
);

// Requests to the private part of the API should be validated
app.all(path.join(config.privatePrefix, '/*'),
  require('./middlewares/auth').validateRequestWithToken
);

// If validation is not needed or successfull, proceed to the routers
app.use(path.join(config.publicPrefix, '/'),
  require('./routes')
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message
  });
});

module.exports = app;
