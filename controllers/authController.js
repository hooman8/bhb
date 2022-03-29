const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first chreck if the user is authenticated
  if(req.isAuthenticated()){
    next(); // carry on they are logged in
    return; // stop the function from execution
  }
  req.flash('error', 'Oops you must be logged in to add a new employee');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if a user with that mail exists
  const user = await User.findOne({email: req.body.email});
  if(!user){
    req.flash('success', 'A password reset has been mailed to you.');
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // that is 1 hour from now
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset',
  });
  req.flash('success', `You have been emailed a password reset link.`);
  // 4. redirect to login page
  res.redirect('/login');

};

// reset password method  - set for updating the password
exports.reset = async (req, res) => {
  // is there someone with this token?
  // res.json(req.params);

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });
  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    res.redirect('/login');
  }
  res.render('reset', {title: 'Reset Your Password'});
};

exports.confirmedPasswords = (req, res, next) => {
  if(req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');s
};

exports.update = async (req, res) => {
  // find the user and confirm that token is still valid
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });
  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    res.redirect('/login');
  }
  // otherwise we want to update the user
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  // remove used token
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // save it to the database
  const updatedUser = await user.save();
  // log user in automatically
  await req.login(updatedUser);
  req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');

};