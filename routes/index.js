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
const Vender = mongoose.model("Vender")
const Order = mongoose.model("Order")
const Items = mongoose.model("Items")

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


/* dashboard  details functionaliy */
router.get('/dashboard', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		Users.count(function(error, user_cont) {
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('index', { title: 'Dashboard', menuId: 'Dashboard', msg: notification_arr, adminname:admin_name});					
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
		
		// var correctedPath = path.normalize(req.file.path);
		// correctedPath = correctedPath.replace(new RegExp(/\\/g),"/");

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
			var file = req.file;
			
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
					venderData.icons_image = clientUrl + "/" + file.filename;
					venderData.role = '1';
					venderData.created_at = moment().format("ll"); 
					
					await venderData.save().then(result => {
						req.flash('type', 'Success');
						req.flash('text_msg', 'Vender created successfully');
						res.redirect("/vender");
					})

					req.flash('type', 'Success');
					req.flash('text_msg', 'Vender created successfully');
					res.redirect("/vender");
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


/* Delete Vender Schema responce */
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
});


/* vender Details functionaliy. */
router.get("/venderDetails/:postId", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			let product_arr = await Items.find({vender_id: req.params.postId});
			if(product_arr != '')
			{
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('venderDetails', { title: 'Vender Details', menuId: 'vender', msg: notification_arr, adminname: admin_name, product_arr: product_arr });
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'User details not found'
				}
				res.render('venderDetails', { title: 'Vender Details', menuId: 'vender', msg: notification_arr, adminname: admin_name, product_arr: product_arr });
			}
		}
		catch(error)
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': error
			}
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'vender'});
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

/* Delete Schema for Boats responce */
router.delete('/removeProduct/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await Items.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
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
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* Logout */
router.get("/logout", async (req,res) => {
	
	req.session.destroy()
	req.flash('type', 'Success');
	req.flash('text_msg', 'Logged out!');
	res.redirect('/');

});

module.exports = router;