const session 	= require('express-session');
const sgMail 	= require('@sendgrid/mail');
var flash    	= require('req-flash');
const mongoose 	= require("mongoose");
var express 	= require('express');
const multer 	= require('multer');
var moment 		= require('moment');
var md5			= require('md5');
var ejs 		= require('ejs');

var path = require('path');

var router = express.Router();

router.use(session({ 
	secret: 'somerandonstuffs',
	resave: false,
	saveUninitialized: false,
	cookie: { expires: 6000000 }
}));

router.use(flash());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var webEmail = process.env.WEBEmail;

const clientUrl = process.env.clientUrl;

const Admin = mongoose.model("Admin")
const Users = mongoose.model("Users")
const Forgotpass = mongoose.model("Forgotpass")
const userGroupModel = mongoose.model("User_group")
const Vender = mongoose.model("Vender")

/* SET STORAGE MULTER*/ 
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads')
	},
	filename: function (req, file, cb) {
		var fileExtension = file.originalname.split('.');
		cb(null, `${file.fieldname}-${Date.now()}.${fileExtension[fileExtension.length - 1]}`);
	}
})
 var upload = multer({ storage: storage })

/* Login url */
router.get('/', function(req, res, next) {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId){				
		res.redirect('/dashboard');		
	}
	else
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
});

/* Login url */
router.get('/login', function(req, res, next) {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId){	
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect('/dashboard');		
	}
	else{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
});

/* Login */
router.post('/login', async (req, res, next) => {
	var username = req.body.username;
	var password = md5(req.body.password);
	var redirecturl = req.body.redurl;
	if(username != '' && password != '')
	{
		var admin_details = await Admin.find({ $and : [ {"email": username }, {"password": password}]}, {"_id":1, "username":1, "email":1, "role":1})
		
		var logintime = new Date().getTime();
		if(admin_details.length > 0)
		{
			req.session.emailId = admin_details[0].email;
			req.session.admin_name = admin_details[0].username;
			req.session.admin_id = admin_details[0]._id;	
			req.session.adminrole = admin_details[0].role;	
			
			const admin_data = await Admin.update(
				{_id : admin_details[0]._id },
				{$set : {login_time : logintime}}
			);
			
			if(redirecturl)
			{						
				req.flash('type', 'Success');
				req.flash('text_msg', 'Login success');				
				res.redirect('/'+redirecturl);						
			}
			else
			{
				req.flash('type', 'Success');
				req.flash('text_msg', 'Login success');
				res.redirect('/dashboard');										
			}
		}	
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Email and password are not match'
			}			
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
		}
	}
	else if(username == ''){
		var notification_arr = {
			'type': 'Error',
			'text_msg': 'Email field is require*'
		}
		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
	else if(password == ''){
		var notification_arr = {
			'type': 'Error',
			'text_msg': 'Password field is require*'
		}
		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
	else{
		res.redirect('/');	
	}		
});


/* forgot password */
router.get("/forgot_password", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}		
		res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
	}
});

/* @router for forgot password */
router.post("/forgot_password", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{		
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var adminemail = req.body.username;
		if(adminemail != '')
		{
			const post = await Admin.findOne({"email": adminemail});
			if(post != '')
			{
				var mailOptions = {
					from: webEmail,
					to: adminemail,
					subject: 'Forgot password',
					html: '<p>Dear <b>'+post.username+',</b></p>'+
						'<p>Someone (hopefully you) requested a password reset at '+clientUrl+'</p>'+
						'<p>To reset your password, please follow the following link: '+clientUrl+'/resetpw/'+post._id+'</p>'+
						'<p>Thank you,<br>Binance Exchange</p>'
				};
				sgMail.send(mailOptions);
				
				const passdetails = new Forgotpass();
				passdetails.user_id = post._id;
				passdetails.email = adminemail;
				passdetails.to_time = new Date().getTime() + (15 * 60 * 1000);
				passdetails.created_at = moment().format("ll"); 
				passdetails.updated_at = moment().format("ll"); 
				
				await passdetails.save();
				req.flash('type', 'Success');
				req.flash('text_msg', 'Please check your email, got a link');
				res.redirect("/login");
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Not record found'
				}
				res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Email field is require**'
			}
			res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
		}		
	}
})

/* resetpassword */
router.get("/resetpw/:postId", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var nowtime = new Date().getTime();
		const linkresult = await Forgotpass.findOne({ $and: [ {user_id: req.params.postId}, {to_time: {$gte: nowtime}} ]});
		if(linkresult != '')
		{
			try{
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}				
				res.render('resetpassword', { title: 'Reset password', menuId: 'Resetpassword', msg: notification_arr, redirecturl: '', adminId: req.params.postId});
			}
			catch(e)
			{
				res.status(500);
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Link has been expired**'
			}
			
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
		}
	}
})

/* Change passsword */
router.post("/resetpw/:postId", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		try{
			const post = await Admin.update(
				{ _id : req.params.postId},
				{ $set : {password : md5(req.body.password)}}
			);
			req.flash('type', 'Success');
			req.flash('text_msg', 'Password reset successful');
			res.redirect('/login');
		}
		catch(e)
		{
			res.status(500);
		}
	}
});

/* dashboard  details functionaliy */
router.get('/dashboard', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		var registered_users = await Users.find().count();
		var Professional_count = await Users.find({"role":1}).count();
		var individual_count = await Users.find({"role":2}).count();
		Users.count(function(error, user_cont) {
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('index', { title: 'Dashboard', menuId: 'Dashboard', msg: notification_arr, adminname:admin_name, user_cont: user_cont, Professional_count : Professional_count, registered_users : registered_users, individual_count : individual_count});					
		});
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'dashboard'});
	}
});

router.get("/vender", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const venderData = await Vender.find({}).sort({"updated_at": -1});

		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('vender', { title: 'Vender Access', menuId: 'vender', msg: notification_arr, adminname:admin_name, venderData: venderData });
	}
});

/*Get  Add_Traders_Category Controller */
router.get('/add_vender', async (req, res) => {
	let emailId = req.session.emailId;
	let admin_name = req.session.admin_name;
  	if(emailId) 
  	{
		var notification_arr = {
			'type' : req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('add_vender', {title:'Add Vender',  menuId:'vender', msg: notification_arr, adminname: admin_name });
	}
  	else 
  	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'vender'});	
  	}
});

/*Post add_vender Controller */
router.post('/add_vender', upload.single('icon'), async (req, res) => {
	let emailId = req.session.emailId;
	let admin_name = req.session.admin_name;
	if(emailId)
	{
		
		var correctedPath = path.normalize(req.file.path);
		correctedPath = correctedPath.replace(new RegExp(/\\/g),"/");

		var email = req.body.email;
		var phone = req.body.phone;
		var pass = req.body.password;
		const store = req.body.storename;
		var conf_pass = req.body.conf_password;

		if(email != '' && phone != '' && store != '' && pass != '' && conf_pass != '')
		{
			const checkphone = await Vender.find({"phone": phone});
			if(checkphone.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this user already exists'
				}
				res.render('add_vender', {title:'Add Vender',  menuId:'vender', msg: notification_arr, adminname: admin_name });
			}
			const checkemail = await Vender.find({"email": email});
			if(checkemail.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this email already exists'
				}
				res.render('add_vender', {title:'Add Vender',  menuId:'vender', msg: notification_arr, adminname: admin_name });
			}
			if(pass == conf_pass)
			{
				try
				{
					const venderData = new Vender();
					venderData.email = req.body.email;
					venderData.phone = req.body.phone;
					venderData.password = req.body.password;
					venderData.store_name = req.body.storename;
					venderData.vender_name = req.body.vendername;
					venderData.icons_image = clientUrl +'/'+ correctedPath;
					venderData.role = '1';
					venderData.created_at = moment().format("ll"); 
					
					await venderData.save().then(result => {
						req.flash('type', 'Success');
						req.flash('text_msg', 'Vender created successfully');
						res.redirect("/vender");
					})
					
					// req.flash('type', 'Success');
					// req.flash('text_msg', 'Vender created successfully');
					// res.redirect("/vender");
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('add_vender', {title:'Add Vender',  menuId:'vender', msg: notification_arr, adminname: admin_name });
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Password and confirm password must be same!'
				}
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Fill are all required field*'
			}
			res.render('add_vender', {title:'Add Vender',  menuId:'vender', msg: notification_arr, adminname: admin_name });
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'vender'});
	}
});


/* Delete Users Schema responce */
router.delete('/removeVender/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try{
			const post = await Vender.findByIdAndRemove({
				_id: req.params.postId
			},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
})




/* User Management */
router.get("/usermanagement", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const users_list = await Users.find().sort({"updated_at": -1});
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('usermanagement', { title: 'User Management', menuId: 'usermanagement', msg: notification_arr,  users_list: users_list, adminname:admin_name});
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'usermanagement'});
	}
});

/* User data json */
router.post("/userslist", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{				
		var findemail = req.body.id;
		var findtype = req.body.type;
		var findstatus = req.body.status;
		var findsubscribe = req.body.subscribe;

		// const admins_arr = await Admin.find({ $and : [
		// 	{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}} 
		// ]});

		if(findsubscribe == '' && findemail == ''  && findstatus != '' && findtype != '')
		{
			const users_result = await Users.find( {$and:[ {'role': findtype}, {'status': findstatus}]}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findsubscribe == '' && findemail == ''  && findstatus == '' && findtype != '')
		{
			const users_result = await Users.find({'role': findtype}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findsubscribe == '' && findemail == ''  && findstatus != '')
		{
			const users_result = await Users.find({'status': findstatus}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}

		else if(findsubscribe != '' && findemail == '')
		{
			const users_result = await Users.find({'user_type': findsubscribe}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findemail != '' && findsubscribe != '')
		{
			const users_result = await Users.find({ $or : [{ 'phone': new RegExp(findemail, 'i') }, { 'contact_name': new RegExp(findemail, 'i') }, {'user_type': findsubscribe} ]}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else
		{
			const users_result = await Users.find({}).limit(10).sort({"created_on": -1});
			ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
			if (err) {
					console.log(err);
				} else {
					
					res.json(data);
				}
			});				
		}
		
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'users'});
	}
});

/* Delete Users Schema responce */
router.delete('/removeuser/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try{
			const post = await Users.findByIdAndRemove({
				_id: req.params.postId
			},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
})


/* Get Add New Users */
router.get("/addNewUser", async (req, res,) => {
	console.log('Inside Add New Users');
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name});

	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addNewUser'});
	}
});

/* Post Add New Users */
router.post("/addNewUser", async (req, res) => {
	console.log('Post Inside Add New Users');
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		var email = req.body.email;
		var phone = req.body.phone;
		var pass = req.body.password;
		var location = req.body.location;
		var username = req.body.username;
		var conf_pass = req.body.conf_password;

		if(email != '' && phone != '' && location != '' && pass != '' && conf_pass != '')
		{
			const checkusername = await Users.find({"username": username});
			if(checkusername.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this username already exists'
				}
				res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name});
			}
			const checkemail = await Users.find({"email": email});
			if(checkemail.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this email already exists'
				}
				res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name});
			}
			if(pass == conf_pass)
			{
				try
				{
					const userData = new Users();
					userData.username = req.body.username;
					userData.email = req.body.email;
					userData.location = req.body.location;
					userData.phone = req.body.phone;
					userData.password = req.body.password;
					userData.role = '1',
					userData.created_at = moment().format("ll"); 
					userData.updated_at = moment().format("ll"); 

					await userData.save();

					// var mailOptions = {
					// 	from: webEmail,
					// 	to: email,
					// 	subject: 'Account successfully created | On GlobeAvenue',
					// 	html: '<p>Dear <b>'+username+',</b></p><p>Your account successful added at globeavenue</p><p>Email: '+email+'<br>Password: '+pass+'</p><p>thanks and regards,<br>globeavenue team</p>'
					// };

					// sgMail.sendMultiple(mailOptions);

					req.flash('type', 'Success');
					req.flash('text_msg', 'User created successfully');
					res.redirect("/usermanagement");

					
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name});
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Password and confirm password must be same!'
				}
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Fill are all required field*'
			}
			res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name});
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addNewUser'});
	}
});




/* Logout */
router.get("/logout", async (req,res) => {
	
	req.session.destroy()
	req.flash('type', 'Success');
	req.flash('text_msg', 'Logged out!');
	res.redirect('/');

});


/* ------------------------------End of Developement ------------------------- */



/* Admin adminaccess */
router.get("/adminaccess", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{		
		const admins_arr = await Admin.find({ $and : [
			{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}} 
		]});
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('adminaccess_role', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, admins_list: admins_arr });					
	
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});


/* Sub admin register */
router.get("/register", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name });		
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'register'});
	}
})


/* Insert data of admin details */
router.post("/register", async (req, res) => {
	console.log('Inside register function')
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
				
		var pass = req.body.password;
		var conf_pass = req.body.conf_password;
		var username = req.body.username;
		var email = req.body.email;
		console.log('-> Role : ', req.body.role)
		
		if(pass != '' && conf_pass != '' && username != '' && email != '')
		{
			const checkusername = await Admin.find({"username": username});
			if(checkusername.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this username already exists'
				}
				res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name });		
			}
			const checkemail = await Admin.find({"email": email});
			if(checkemail.length > 0)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'this email already exists'
				}
				res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name });		
			}
			if(pass == conf_pass)
			{
				try {
					const post = new Admin();
					post.username = req.body.username;
					post.email = req.body.email;
					post.password = md5(req.body.password);
					post.role = req.body.role;
					post.created_at = moment().format("ll"); 
					post.updated_at = moment().format("ll"); 
					
					await post.save();
					
					var mailOptions = {
						from: webEmail,
						to: email,
						subject: 'Account successfully created | On GlobeAvenue',
						html: '<p>Dear <b>'+username+',</b></p><p>Your account successful added at GlobeAvenue</p><p>Email: '+email+'<br>Password: '+pass+'</p><p>thanks and regards,<br>Globe Avenue</p>'
					};

					sgMail.sendMultiple(mailOptions);
					req.flash('type', 'Success');
					req.flash('text_msg', 'Details are stored successful');
					res.redirect("/adminaccess");
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name});		
				}			
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Password and confirm password must be same!'
				}
				res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name });		
			}			
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Fill are all required field*'
			}
			res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name,});		
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'register'});
	}
})

/* Edit admin access role */
router.get("/editdetails/:postID", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try
		{
			const post = await Admin.findOne({_id: req.params.postID});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('editadminrole', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, editadmin_details: post });					
		}
		catch(error)
		{
			var notification_arr = {
				'type': 'Warning',
				'text_msg': error
			}
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

/* Update admin access role */
router.post("/editdetails/:postID", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try
		{			
			await Admin.update({ _id : req.params.postID},{ $set : {role : req.body.role}});
			req.flash('type', 'Success');
			req.flash('text_msg', 'Update successful');
			res.redirect("/adminaccess");
		}
		catch(error)
		{
			const admins_arr = await Admin.find({ $and : [
				{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}}
			]});
			var notification_arr = {
				'type': 'Error',
				'text_msg': error
			}
			res.render('adminaccess_role', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, admins_list: admins_arr });		
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

/*  Delete Schema responce */
router.delete('/removeadmin/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try
		{
			const post = await Admin.findByIdAndRemove({_id: req.params.postId},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

module.exports = router;