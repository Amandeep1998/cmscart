const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');

var {User} = require('./../models/user');

//Get /
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register'
  });
});

//post register
router.post('/register', (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var username = req.body.username;
  var password2 = req.body.password2;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').isEmail();
  req.checkBody('username', 'UserName is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Password do not match').equals(password);

  var errors = req.validationErrors();

  if(errors) {
    res.render('register', {
      title: 'Register',
      errors: errors,
      user : null //because we have only get request for all to set req.user = null
    });
  } else {
      User.findOne({username: username}).then((user) => {
        if(user) {
          res.render('register', {
            title: 'Register'
          });
          req.flash('danger', 'Username exist choose another');
          res.redirect('/users/register');
        } else {
            var user = new User({
              name: name,
              email: email,
              username:username,
              password:password,
              admin: 0
            });

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) console.log(err);
                user.password = hash;

                user.save().then(() =>{
                  req.flash('success', 'You have successfully Registered');
                  res.redirect('/users/login');
                 }).catch((e) => {
                  console.log(e);
                });
              });
            });
          }
      }).catch((e) => {
        console.log(e);
        return res.sendStatus(400);
      });
  }
});

//get Login
router.get('/login', (req, res) => {
  if(res.locals.user) {
    redirect('/');
  }
  res.render('login', {
    title: 'Login'
  });
});

//post login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

//get logout
router.get('/logout', (req, res, next) => {
  delete req.session.cart;
  req.logout();
  req.flash('success', 'You have logged out');
  res.redirect('/users/login');
});

//exports
module.exports = router;
