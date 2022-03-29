const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts:[
    {type:mongoose.Schema.ObjectId, ref: 'Employee'}
  ],
  isAdmin: {
    type: Boolean,
    default: false
  }
});
// gravatar could be a virtual field -(has app for shifts and time off requests) something that could be generated e.g. miles per hour to km per hour
userSchema.virtual('gravatar').get(function(){
  // seeks for a hash of email address (because we dont want to leak the email)
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);