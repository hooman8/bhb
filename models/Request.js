const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const requestSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: 'You must specify an employee!'
  },
  category: {
    type: String,
    required: 'Please specify the request type'
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  operation: String,
  customValue: {
    type: Number,
    min: 1,
    max:11
  },
  shift: {
    type: String,
    required: 'Please specify the shift that this request is submitted for'
  },
  actualHours: {
    type: Number,
    required: 'You must provide the hours that this shift entails'
  },
  date:{
    type: [Date],
    required: 'You must provide a date'
  },
  text: {
    type: String,
    required: 'You must provide a note for your supervisor'
  },
  attachment: String,
  state: {
    type: String,
    default: 'pending'
  }
});

// we need to auto populate author and employee
function autoPopulate(next) {
  this.populate('author employee')
  //this.populate('employee')
  next();
}

requestSchema.pre('find', autoPopulate);
requestSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Request', requestSchema);