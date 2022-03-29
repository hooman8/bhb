const mongoose = require('mongoose');
const Request = mongoose.model('Request');


exports.addRequest = async (req, res) => {
  // we need to identify the submitter and the employeee for whom this request is submitted
  req.body.author = req.user._id;
  req.body.employee = req.params.id;
  // res.json(req.body);
  const newRequest = new Request(req.body);
  await newRequest.save();
  req.flash('success', 'Request submitted');
  res.redirect('back');
}; 



