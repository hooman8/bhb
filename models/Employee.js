// package used to interface with mongodb
const { text } = require('express');
const mongoose = require('mongoose');
// V8 Promise instead of built in promise
mongoose.Promise = global.Promise;
// slugs allow us to make url friendly names
const slug = require('slugs');

// Create mongoose schema
const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter an employee name!'
  },
  slug: String,
  bio: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  startDate: Date,
  endDate: Date,
  vacationQuota: Number,
  lieuBalance: Number,
  sickBalance: Number,
  miscBalance: Number,
  rollover: Number,
  allowanceProfile: String,
  rank: String,
  brid: String,
  email: String,
  photo: String,
  shift: String,
  actualHours: Number,
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: {virtuals: true},   // virtual fields dont get populated automatically unless we ask them to
  toObject: {virtuals: true}
});

// define our indexes
employeeSchema.index({
  name: 'text',
  bio: 'text'
});

// Auto generate slugs filed so they could be passed in as a pre hook (before a new doc created)
// this might be useful for autoGenerations mechanisms or fields
employeeSchema.pre('save', async function(next){
  if(!this.isModified('name')){
    next(); // skip it
    return; // stop function from running
  }
  this.slug = slug(this.name);
  // Query the database to see if the slug already exist
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  // how do you access model inside of a model function? the employee is not created yet
  const employeesWithSlug = await this.constructor.find({slug: slugRegEx});
  if(employeesWithSlug.length) {
    this.slug = `${this.slug}-${employeesWithSlug.length + 1}`;
  }
  next();
});

employeeSchema.statics.getTagsList = function() {
  // all static methods are bound to model meaning we can use this.find() for example
  return this.aggregate([
    {$unwind: '$tags'}, // this allows you to unwind tags array 
    {$group: {_id: '$tags', count: {$sum: 1}}},
    {$sort: {count: -1}}
  ]);
}
employeeSchema.statics.getEmployeeStats = function() {
  return this.aggregate([
    // inside of an static func you dont have access to virtuals
    // look up employees and populate their requests
    // mongodb takes your model, lowercase it and puts 's' at the end of it
    {$lookup: {
      from: 'requests', localField: '_id', foreignField: 'employee', as: 'requests'
    }}, // lookup populates virtual fields
    // filter for items that have 2 or more requests
    {$match: {'requests.1': {$exists: true}}},
    // add the sum request field
    {$addFields: {
      totalVacationTaken: { $sum: '$requests.actualHours' }
    }},
    // sort it by our own new field, highest requestors first
    { $sort: { totalVacationTaken: -1 } },
    // limit to at most 10
    {$limit: 10}

  ]);
}
// User.js also uses virtual - instead of go get something we want to tell it what to do
// go to another model and do a quick query for us
// find requests that the employee id === request employee id
employeeSchema.virtual('requests', {
  ref: 'Request', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'employee' // which field on the request?
});

// function autoPopulate(next) {
//   this.populate('requests');
//   next();
// }
// employeeSchema.pre('find', autoPopulate);
// employeeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Employee', employeeSchema);
