const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);


const path = require('path');

var config = require('./config/database');

//Connect to database
mongoose.connect(config.database);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connect to database');
});

//Init app
var app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//set public folder
app.use(express.static(path.join(__dirname, 'public')));

//set global errors
app.locals.errors = null; //to set global errors to null whenevr the page loads *note*

//GEt page model
var {Page} = require('./models/page.js');

//Pass all pages to header.ejs
Page.find({}).sort({sorting: 1}).exec(function(err, pages) {//fin({}) means return everything and sort 1 means in ascending order
  if(err) {
    console.log(err);
  } else {
      app.locals.pages = pages; //now pages can be access anywhere
  }
});

//GEt page model
var {Category} = require('./models/category.js');

//Pass all categories to header.ejs
Category.find({}).then((categories) => {
  app.locals.categories = categories; //now categories can be access anywhere
}).catch((e) => {
  console.log(e);
});


//fileUpload middleware
app.use(fileUpload());
//Body-parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//Express-session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore(options)

  // cookie: { secure: true }
}));

//Express -validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  },
  customValidators: {
    isImage: function(value, filename) {
      var extension = (path.extname(filename)).toLowerCase();
        switch (extension) {
          case '.jpg':
            return '.jpg';
          case '.jpeg':
            return '.jpeg';
          case '.png':
            return '.png';
          case '':
            return '.jpg';
          default:
            return false;
        }
    }
  }
}));
//Express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
//passport config
var {passportSetup} = require('./config/passport');
passportSetup(passport);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => { //* gets all the get request
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null; //req.user is set if the authentication is succeful
  next();
});

//Set routes
var pages = require('./routes/pages');
var products = require('./routes/products');
var cart = require('./routes/cart');
var users = require('./routes/users');
var admin_pages = require('./routes/admin_pages');
var admin_categories = require('./routes/admin_categories');
var admin_products = require('./routes/admin_products');


app.use('/admin/pages', admin_pages);
app.use('/admin/categories', admin_categories);
app.use('/admin/products', admin_products);
app.use('/users', users);
app.use('/cart', cart);
app.use('/products', products);
app.use('/', pages); //keeping this routes last allows to check others routes conditions
//Start the server
var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Starting server at ${port}`);
})

module.exports = {app};
