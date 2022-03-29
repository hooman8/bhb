const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const requestController = require('../controllers/requestController');
const { catchErrors } = require('../handlers/errorHandlers');
// We have our homepage to display all employees
router.get('/', catchErrors(employeeController.getEmployees));
// addEmployee renders the page for adding a new employee
// before you show them the addEmployee page you have to check for authentication
router.get('/add',authController.isLoggedIn, employeeController.addEmployee);
// post to the page created above for the actual employee creation
router.post('/add',
  employeeController.upload,
  catchErrors(employeeController.resize),
  catchErrors(employeeController.createEmployee)
);
// edit a single employee
router.get('/employees/:id/edit', catchErrors(employeeController.editEmployee));
// Get all employees
router.get('/employees', catchErrors(employeeController.getEmployees));
// Update a single employee - edit employee uses this function for updating
router.post('/add/:id',
  employeeController.upload,
  catchErrors(employeeController.resize),
  catchErrors(employeeController.updateEmployee)
);
// see a single store
router.get('/employee/:slug', catchErrors(employeeController.getEmployeeBySlug));

// this section belongs to tags page
router.get('/tags', catchErrors(employeeController.getEmployeesByTag));
router.get('/tags/:tag', catchErrors(employeeController.getEmployeesByTag));


// ------login section--------
// this is for login
router.get('/login', userController.loginForm);
// we need a post method to login against
router.post('/login', authController.login);
// this is for register
router.get('/register', userController.registerForm);

// 1. validate the rergistration data
// 2. register the user
// 3. we need to log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

// this is your logout mechanism
router.get('/logout', authController.logout);

// this is the route for viewing the account page
router.get('/account', authController.isLoggedIn, userController.account);

// Making a post request for updating account
router.post('/account', catchErrors(userController.updateAccount));

// Reset your password post method
router.post('/account/forgot', catchErrors(authController.forgot));

// password reset handle page
router.get('/account/reset/:token', catchErrors(authController.reset));

// making post request to set the new password
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

// displaying hearted employees
router.get('/hearts', authController.isLoggedIn, catchErrors(employeeController.getHearts));


// submit a new request
router.post('/requests/:id', authController.isLoggedIn, catchErrors(requestController.addRequest));

router.get('/top', catchErrors(employeeController.getEmployeeStats));



// API Section

router.get('/api/search', catchErrors(employeeController.searchEmployees));
router.post('/api/employees/:id/heart', catchErrors(employeeController.heartEmployee));



module.exports = router;

