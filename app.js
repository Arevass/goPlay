var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');

mongoose.connect('mongodb://localhost/goplay');

require('./models/Clubs');
require('./models/Events');
require('./models/Users');

require('./config/passport');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var Simplify = require("./node_modules/simplify-commerce/simplify.js"),
    client = Simplify.getClient({
      publicKey: 'sbpb_M2EwNmRlNjEtMDZjZC00NzdiLWJjNWMtY2Y0ZmE4ZjMxZjcw',
      privateKey: 'yK9tO4zFpKqQSmSfEUQgBqGWTalrPDdjWmxBGIxEN/95YFFQL0ODSXAOkNtXTToq'
});

app.post('/payment', function(req, res) {

  console.log('Amount', req.body.amount);
  console.log('Token', req.body.token);

  client.payment.create({
    amount : req.body.amount,
    token : req.body.token,
    reference : "7a6ef6be31",
    description : "Test Payment",
    currency : "USD"
  }, function(errData, data){

    if(errData){
      console.error("Error Message: " + errData.data.error.message);
      // handle the error

      res.sendStatus(404);
      return;
    }

    console.log("Payment Status: " + data.paymentStatus);
    res.redirect('/success.html');
  });
});

module.exports = app;
