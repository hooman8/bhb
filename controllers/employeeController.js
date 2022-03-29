// need mongoose for accessing the database
const mongoose = require("mongoose");
// import employee model
const Employee = mongoose.model('Employee');
// ------------------------ Image Handling --------------------------------
// Used for photo resizing
const jimp = require('jimp');
// Used for creating unique file names
const uuid = require('uuid');

exports.resize = async (req, res, next) => {
  // check if there is a new file to resize
  // multer puts the image as a property of req file
  if(!req.file) {
    next(); // skip to the next middleware
    return; 
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
}

// Multter helps us upload file and jim hels with resizing it
const multer = require('multer');
const User = require("../models/User");
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto){
      next(null, true);
    } else {
      next({message: 'That filetype isn\'t allowed!' }, false);
    }
  }
}

exports.upload = multer(multerOptions).single('photo');

// ------------------------ End of Image handling --------------------------------
// router.get('/', employeeController.homePage);
exports.homePage = (req, res) => {
  res.render('index');
}

// editEmployee - we're using a single template for adding and/or editing an employee
// router.get('/add', employeeController.addEmployee);
exports.addEmployee = (req, res) => {
  res.render('editEmployee', {title: 'Add Employee'});
};

// createEmployee is where you actually create the database post("/add", createEmployee)
// router.post('/add', catchErrors(employeeController.createEmployee))
exports.createEmployee = async (req, res) => {
  // take the user id of already logged in user and update owner 
  req.body.owner = req.user._id;
  // console.log(req.body);
  // res.json(req.body); <-- this is very handy if we want to validate our form
  const employee = await (new Employee(req.body)).save();
  // flash a message to inform user of successful user creation 
  req.flash('success', `Successfully created a profile for ${employee.name}.`);
  // redirect them to newly created employee page
  res.redirect(`/employee/${employee.slug}`);
};

// display employees - router.get('/employees', employeeController.getEmployees);
exports.getEmployees = async(req, res) => {
  // Query the database for a list of all store
  const employees = await Employee.find().populate('requests');
  // res.json(employees);
  res.render('employees', {title: 'Employees', employees});
};

// you have to be able to confirm that you are the actual employee
const confirmOwner = (employee, user) => {
  console.log(!user.isAdmin);
  // !employee.owner.equals(user._id)
  if(!employee.owner.equals(user._id)) {
    if((!user.isAdmin)) {
      throw Error('You must own a store in order to edit it!');
    }
  }
};
// edit a single employee router.get('/employees/:id/edit', catchErrors(employeeController.editEmployee))
exports.editEmployee = async (req, res) => {
  // find the employee given the id 
  // res.json(req.params);
  const employee = await Employee.findOne({_id: req.params.id});
  // res.json(employee);
  // confirm they are the owner of the store
  confirmOwner(employee, req.user);
  res.render('editEmployee', {title: `Edit ${employee.name}`, employee});
  //  render out the edit form so the user can update their profile
}; 

// Update a single employee - edit employee uses this function for updating
exports.updateEmployee = async (req, res) => {
  // find and update the employee
  //  query data and options
  const employee = await Employee.findOneAndUpdate({_id: req.params.id}, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true // check againts the required validation in our model
  }).exec();
  // redirect them the store and tell them it worked
  req.flash('success', `successfully update <strong> ${employee.name}'s profile </strong>. <a href="/employees/${employee.slug}"> View Employee</a>`);
  res.redirect(`/employees/${employee._id}/edit`);

};



exports.getEmployeeBySlug = async (req, res, next) => {
  // when we visit an employee page, we want to execute a second query to pull in the request,
  // submitted by this employee
  // a better approach would be to do a virtual populate with mongoose
  // virtual fields dont get populated automatically unless we ask them to
  const employee = await Employee.findOne({slug: req.params.slug}).populate('owner requests');
  
  // check if the employee is found and if not give 404
  if(!employee) {
    next();
    return;
  }
  res.render('employee', {employee, title: employee.name})

};

exports.getEmployeesByTag = async (req, res) => {
  // res.send('it works!!');
  // we have to pass the data about what tag we're on onto our template
  const tag = req.params.tag;
  const tagQuery = tag || {$exists: true}
  // get a list of all the tags and count their occurrences - static method that lives in our model
  // if the first request doesnt depend on the second one we have to run them at the same time
  const tagsPromise = Employee.getTagsList();
  const employeesPromise = Employee.find({tags:tagQuery}).populate('requests');
  const [tags, employees] = await Promise.all([tagsPromise, employeesPromise]);

  // res.json(tags);
  res.render('tag', {tags, title: 'Tags', tag, employees});

};

// This is an API endpoint
exports.searchEmployees = async(req, res) => {
  // res.json({it: 'Worked'});
  // res.json(req.query);
  const employees = await Employee.find({
    $text: {
      $search: req.query.q //$text performs a text search on the content of the fields indexed with a text index
    }
  }, {
    score: {$meta: 'textScore'} //add a field for score made up of meta deta for textScore
  })
  .sort({
    score: {$meta: 'textScore'}
  })
  .limit(5);
  res.json(employees);
};

exports.heartEmployee = async(req, res) => {
  // want to be able to create a toggle effect
  // convert an array of objects to array of strings
  const hearts = req.user.hearts.map(obj => obj.toString());
  // pull removes it and add to set adds it but make sure its not already there
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findOneAndUpdate(req.user._id, 
    {[operator] : {hearts: req.params.id}},
    { new: true }
  ); 
  res.json(user);

};

// /hearts/
exports.getHearts = async (req, res) => {
  // query employee and find those employees that their ids is in our heart array
  const employees = await Employee.find({
    _id: {$in: req.user.hearts}
  }); 
  res.render('employees', {title: 'Your team', employees});
};


exports.getEmployeeStats = async (req, res) => {
  // complex queries should go on the model itself
  const employees = await Employee.getEmployeeStats();
  // res.json(employees);
  res.render('employeeStats', {employees, title: 'Employees Stats'});
}