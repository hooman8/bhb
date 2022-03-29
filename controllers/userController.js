const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


exports.loginForm = (req, res) => {
  res.render('login', {title: 'Login'})
};

exports.registerForm = (req, res) => {
  res.render('register', {title: 'Register'});
};

// 1. validate the rergistration data
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'that Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirm Password cannot be blank!').notEmpty();

  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);
  const errors = req.validationErrors();
  if(errors){
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {title: 'Register', body: req.body, flashes: req.flash()}); 
    return; // stop the function from running
  }
  next(); // there were no errors!
};

// 2. register the user
exports.register = async (req, res, next) => {
  // res.json(req.body);
  const user = new User({ email: req.body.email, name: req.body.name});
  const register = promisify(User.register, User); // if the method lives on an object you have to specify the model you're binding it with
  await register(user, req.body.password);
  next(); // pass to authController.login
};

// this is the route for the useraccount's get method

exports.account = (req, res) => {
  res.render('account', {title: 'Edit Your Account'});
}

exports.updateAccount = async (req, res) => {
  // take the data and update their account with it
  // we dont want to update all the values 
  const updates = {
    name: req.body.name,
    email: req.body.email
  };
  // this takes 3 things: query, update, and options
  const user = await User.findOneAndUpdate(
    { _id:req.user._id },
    {$set: updates},
    {new: true, runValidators: true, context: 'query'}
  );
  req.flash('success', 'Update the profile!');
  res.redirect('back');

};
