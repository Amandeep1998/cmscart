const LocalStrategy = require('passport-local').Strategy; //note this
const bcrypt = require('bcryptjs');

var {User} = require('./../models/user');


var passportSetup = function (passport) {
  passport.use(new LocalStrategy(function (username, password, done){
    User.findOne({username: username}).then((user) => {
      if(!user) {
        return done(null, false, {message:'No User Found'});
      }
        bcrypt.compare(password, user.password, function (err, isMatch) {
          if(err) {
            console.log(err);
          }
          if(isMatch) {
            return done(null, user);
          } else {
            return done(null, false, {message:'Wrong Password'});
          }
        });
    }).catch((e) => {
      console.log(e);
    });
  }));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}

module.exports = {passportSetup}
