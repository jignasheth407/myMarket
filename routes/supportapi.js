var HttpStatus = require("http-status-codes");
const session = require("express-session");
var nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const multer = require("multer");
var express = require("express");
var moment = require("moment");
const axios = require("axios");

var path = require("path");

var router = express.Router();

router.use(
  session({
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 6000000 },
  })
);

/* SET STORAGE MULTER */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    var fileExtension = file.originalname.split(".");
    cb(
      null,
      `${file.fieldname}-${Date.now()}.${
        fileExtension[fileExtension.length - 1]
      }`
    );
  },
});

const upload = multer({ storage: storage });

/* model */
const Users = mongoose.model("Users");
const itemsSchema = mongoose.model("Items");
const categorySchema = mongoose.model("Category");
const Vender = mongoose.model("Vender");
const Customer = mongoose.model("Customer");
const Order = mongoose.model("Order");

const clientUrl = process.env.clientUrl;

/* user register API Functionality */
router.post("/registerUser", async (req, res) => {
    if(req.body.role == undefined || req.body.role == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "role cannot be blank" });
        return;
    }
    if(req.body.username == undefined || req.body.username == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "username cannot be blank" });
        return;
    }
    if(req.body.email == undefined || req.body.email == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "email cannot be blank" });
        return;
    }
    if(req.body.password == undefined || req.body.password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "password cannot be blank" });
        return;
    }
    if (req.body.conf_password == undefined || req.body.conf_password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "conf_password cannot be blank" });
        return;
    }
    var email_ = req.body.email;
    var pass = req.body.password;
    var location = req.body.location;
    var username = req.body.username;
    var conf_pass = req.body.conf_password;

    const checkUsername = await Users.find({ username: username });
    if (checkUsername.length > 0) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "this Username already exists!" });
        return;
    }
    const checkEmail = await Users.find({ email: email_ });
    if (checkEmail.length > 0) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "this email already exists!" });
        return;
    }
    if (username.length < 3) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "Username must be greater than 2 letters" });
        return;
    }
    if (username.length > 25) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "Username must be less than 25 letters" });
        return;
    }
    if (email_) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var results = re.test(email_);
        if (results == false) {
            res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "Invalid email id" });
            return;
        }
    }
    if (pass == conf_pass) {
        try {
            let registerUser = new Users({
                email: email_,
                role: req.body.role,
                logo_url: req.body.logo_url,
                username: req.body.username,
                password: req.body.password,
                created_at: moment().format("ll"),
            });
            registerUser.save(function (error, created) {
                console.log(error);
                if (created) {
                    res.json({
                        status: true,
                        msg: "user registered successfully.",
                        data: created,
                    });
                    return;
                }
                else {
                    res.json({ status: false, msg: "username already exists." });
                    return;
                }
            });
        }
        catch (error) {
            console.log(error);
            res.json({ error_msg: "Something went wrong" });
            return;
        }
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({status: false, msg: "Password and confirm password must be same!!" });
        return;
    }
});

/* customer register API Functionality */
router.post("/registerCustomer", async (req, res) => {
    if (req.body.customer_name == undefined || req.body.customer_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "customer_name cannot be blank" });
        return;
    }
    if (req.body.phone == undefined || req.body.phone == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "phone cannot be blank" });
        return;
    }
    if (req.body.address == undefined || req.body.address == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "address cannot be blank" });
        return;
    }
    if (req.body.password == undefined || req.body.password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "password cannot be blank" });
        return;
    }
    if (req.body.conf_password == undefined || req.body.conf_password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "conf_password cannot be blank" });
        return;
    }

    var phone = req.body.phone;
    const checkPhone = await Customer.find({ phone: phone });

    if (checkPhone.length > 0) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "this user already exists!" });
        return;
    }
    const checkVender = await Vender.find({ phone: phone });
    if (checkVender.length > 0) {
        res.status(HttpStatus.NOT_FOUND).json({status: false, msg: "this mobile number already exists use another number" });
        return;
    }

    if (phone.length != 10) {
        res.status(HttpStatus.NOT_FOUND).json({status: false, msg: "phone number must be enter 10 characters"});
        return;
    }
    if(isNaN(phone) || phone.indexOf(" ") != -1) {
        res.status(HttpStatus.NOT_FOUND).json({ status: false, msg: "Enter numeric value" });
        return false;
    }
    var password = req.body.password;
    var conf_password = req.body.conf_password;
    if (password.length < 6) {
        res.status(HttpStatus.NOT_FOUND).json({
            success: false,
            msg: "Password should be minimum 6 characters!",
        });
        return;
    }
    if (password == conf_password){
        try
        {
            customerData = new Customer({
                role: 2,
                password: password,
                city: req.body.city,
                phone: req.body.phone,
                address: req.body.address,
                customer_name: req.body.customer_name,
                created_at: moment().format("ll"),
            });
            customerData.save().then((result) => {
                //console.log(result);
                res.status(201).json({
                    msg: "customer registered successfully",
                    customerInfo: {
                        _id: result._id,
                        name: result.customer_name,
                        phone: result.phone,
                        city: result.city,
                    },
                });
            });
        }
        catch (error)
        {
            console.log(error);
            res.json({ error_msg: "Something went wrong" });
            return;
        }
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({
            status: false,
            msg: "Password and confirm password must be same!",
        });
        return;
    }
});

/* customer Login API Functionality */
router.post("/customerLogin", async (req, res) => {
    if (req.body.phone == undefined || req.body.phone == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "phone cannot be blank" });
        return;
    }
    if (req.body.password == undefined || req.body.password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "password cannot be blank" });
        return;
    }
    var username = req.body.phone;
    var password = req.body.password;
    const customerDetail = await Customer.find({ phone: username });
    var logintime = new Date().getTime();

    if (customerDetail.length > 0) {
        if (password == customerDetail[0].password) {
            req.session.phone = customerDetail[0].phone;
            req.session.customer_id = customerDetail[0]._id;
            req.session.customerName = customerDetail[0].customer_name;

            const user_data = await Customer.update(
                { _id: customerDetail[0]._id },
                { $set: { login_time: logintime }
            });
            res.status(200).json({
                success: true,
                msg: "customer login Successfully !",
                result: {
                    customer_id: customerDetail[0]._id,
                    customer_name: customerDetail[0].customer_name,
                    phone: customerDetail[0].phone,
                    city: customerDetail[0].city,
                },
            });
            return;
        }
        else
        {
            res.status(400).json({ success: false, msg: "Invalid phone_number or password !" });
            return;
        }
    }
    else
    {
        res.status(400).json({ success: false, msg: "Unknown user !" });
        return;
    }
});

/* vender login API Functionality */
router.post("/login", async (req, res) => {
    if (req.body.phone == undefined || req.body.phone == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "phone cannot be blank" });
        return;
    }
    if (req.body.password == undefined || req.body.password == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "password cannot be blank" });
        return;
    }

    var username = req.body.phone;
    var password = req.body.password;
    //const userDetails = await Users.find({ $and : [ {"email": username }, {"password": password}]});
    const userDetails = await Vender.find({ phone: username });

    var logintime = new Date().getTime();

    if (userDetails.length > 0) {
        if (password == userDetails[0].password) {
            req.session.emailId = userDetails[0].email;
            req.session.contactName = userDetails[0].vender_name;
            req.session.user_id = userDetails[0]._id;
            req.session.userrole = userDetails[0].role;

            const user_data = await Vender.update(
                { _id: userDetails[0]._id },
                { $set: { login_time: logintime }
            });
            res.status(200).json({
                success: true,
                msg: "vender login Successfully !",
                result: {
                    icons_image: userDetails[0].icons_image,
                    vender_name: userDetails[0].vender_name,
                    store_name: userDetails[0].store_name,
                    phone: userDetails[0].phone,
                    email: userDetails[0].email,
                    vender_id: userDetails[0]._id,
                },
            });
            return;
        }
        else
        {
            res.status(400).json({ success: false, msg: "Invalid Username or password !" });
            return;
        }
    }
    else
    {
        res.status(400).json({ success: false, msg: "Unknown user !" });
        return;
    }
});

/* add Category API Functionality */
router.post("/addCategory", async (req, res) => {
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "vender_id cannot be blank" });
        return;
    }
    if (req.body.category_name == undefined || req.body.category_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_name cannot be blank" });
        return;
    }
    const venderId = await Vender.findOne({ _id: req.body.vender_id });
    if (venderId != null)
    {
        try
        {
            let categoryDetails = new categorySchema({
                vender_id: venderId,
                category_name: req.body.category_name,
                created_at: moment().format("ll"),
            });
            categoryDetails.save(function (error, created) {
                if (error) {
                    console.log("error :", error);
                    res.status(HttpStatus.EXPECTATION_FAILED).json({ success: false, msg: "category already exist" });
                    return;
                }
                else
                {
                    res.status(HttpStatus.CREATED).json({
                        success: true,
                        msg: "category created successfully.",
                        data: created,
                    });
                    return;
                }
            });
        }
        catch (error)
        {
            console.log(error);
            res.status(HttpStatus.NOT_FOUND).json({ error_msg: "Something went wrong" });
            return;
        }
    } 
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "invalid  vender." });
        return;
    }
});

/* categoryById API Functionality */
router.post("/categoryById", async (req, res) => {
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "vender_id cannot be blank" });
        return;
    }

    let category = await categorySchema.find({ vender_id: req.body.vender_id });
    if (category != null && category.length > 0) {
        res.status(200).json({ success: true, categoryList: category });
        return;
    }
    res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "no category found." });
    return;
});

/* categoryList API Functionality */
router.get("/categoryList", async (req, res) => {
    let data = await categorySchema.find({});
    if ( data != undefined && data.length > 0 ) 
    {
        res.json({ status: true, msg: "category list", data });
        return;
    } 
    else
    {
        res.json({ status: false, msg: "no category found.", data });
        return;
    }
});

/* search procuct by category API Functionality */
router.post("/categoryByProduct", async (req, res) => {
    if (req.body.category_id == undefined || req.body.category_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_id can not be blank" });
        return;
    }
    const product = await itemsSchema.find({ category_id: req.body.category_id });
    if (product != undefined && product.length > 0) {
        res.status(HttpStatus.OK).json({ success: true, product });
        return;
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "Product not found.", product });
        return;
    }
});

/* Delete Category Details API Functionality */
router.post("/deleteCategory", async (req, res) => {
    if (req.body.postId == undefined || req.body.postId == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "invalid access" });
        return;
    }
    const result = await categorySchema.findOne({ _id: req.body.postId });
    if(result)
    {
        let result = await categorySchema.findByIdAndRemove({ _id: req.body.postId },
        function (err, success) {
            if (err) {
                console.log(err);
                res.status(HttpStatus.NOT_FOUND).json({ err: err });
            }
            else
            {
                res.status(HttpStatus.OK).json({ success: true, msg: "category deleted successfully" });
                return;
            }
        });
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "category not found" });
        return;
    }
});

/* add Product API Functionality*/
router.post("/addProduct", upload.single("productImage"), (req, res, next) => {
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "vender_id cannot be blank" });
        return;
    }
    if (req.body.category_id == undefined || req.body.category_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_id cannot be blank" });
        return;
    }
    if (req.body.category_name == undefined || req.body.category_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_name cannot be blank" });
        return;
    }
    if (req.body.product_name == undefined || req.body.product_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "product_name cannot be blank" });
        return;
    }
    if (req.body.price == undefined || req.body.price == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "price cannot be blank" });
        return;
    }
    var file = req.file;
    if (!file) {
        res.status(400).json({ success: false, msg: "pleae select the image file" });
        return false;
    }
    else
    {
        productData = new itemsSchema({
            vender_id: req.body.vender_id,
            category_id: req.body.category_id,
            category_name: req.body.category_name,
            product_name: req.body.product_name,
            price: req.body.price,
            base64_image: clientUrl + "/" + file.filename,
            created_at: moment().format("ll"),
        });
        productData.save().then((result) => {
            //console.log("-> Result:", result);
            res.status(201).json({ message: "product created successfully",
                Product: {
                    product_id: result._id,
                    vender_id: result.vender_id,
                    category_id: result.category_id,
                    category_name: result.category_name,
                    product_name: result.product_name,
                    price: result.price,
                    productImage: result.base64_image,
                },
            });
        }).catch((err) => {
            console.log(err);
            res.status(500).json({ error: err });
        });
    }
});

/* add Product using Base64 API Functionality */
router.post("/addProductBase64", async (req, res) => {
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "vender_id cannot be blank" });
        return;
    }
    if (req.body.product_name == undefined || req.body.product_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "product_name cannot be blank" });
        return;
    }
    if (req.body.category_id == undefined || req.body.category_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_id cannot be blank" });
        return;
    }
    if (req.body.category_name == undefined || req.body.category_name == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "category_name cannot be blank" });
        return;
    }
    try {
        let productDetails = new itemsSchema({
        vender_id: req.body.vender_id,
        category_id: req.body.category_id,
        category_name: req.body.category_name,
        product_name: req.body.product_name,
        price: req.body.price,
        base64_image: req.body.base64_image,
        created_at: moment().format("ll"),
        status: false,
        });
        productDetails.save(function (error, created) {
            if (error) {
                console.log("error :", error);
                res.status(HttpStatus.EXPECTATION_FAILED).json({ success: false, msg: "product not created" });
                return;
            }
            else {
                res.status(HttpStatus.CREATED).json({
                    success: true,
                    msg: "product created successfully.",
                    data: created,
                });
                return;
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "Something went wrong" });
        return;
    }
});

/* Product List API  Functionality */
router.get("/productList", async (req, res) => {
    let data = await itemsSchema.find({});
    if (data != undefined && data.length > 0) {
        res.status(HttpStatus.OK).json({ success: true, msg: "product list", data });
        return;
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "no product found.", data });
        return;
    }
});

/* Delete Item Details API Functionality */
router.post("/deleteProduct", async (req, res) => {
    if (req.body.postId == undefined || req.body.postId == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "invalid access" });
        return;
    }
    const result = await itemsSchema.findOne({ _id: req.body.postId });
    if (result)
    {
        let result = await itemsSchema.findByIdAndRemove({ _id: req.body.postId },
        function (err, success){
            if (err) {
                console.log(err);
                res.status(HttpStatus.NOT_FOUND).json({ err: err });
            }
            else
            {
                res.status(HttpStatus.OK).json({ success: true, msg: "Product deleted successfully" });
                return;
            }
        });
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "Product not found" });
        return;
    }
});

/* select Product API Functionality */
router.post("/selectProduct", async (req, res) => {
    if (req.body.customer_id == undefined || req.body.customer_id == null) {
        res.status(400).json({ error_msg: "customer_id not found." });
        return;
    }
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(400).json({ error_msg: "vender_id not found." });
        return;
    }
    if (req.body.phone_number == undefined || req.body.phone_number == null) {
        res.status(400).json({ error_msg: "phone_number not found." });
        return;
    }

    var products = [];
    var product = req.body.select_product;

    for (var i = 0; i < product.length; i++)
    {
        products.push({
            price: product[i].price,
            address: req.body.address,
            phone: req.body.phone_number,
            quantity: product[i].quantity,
            category: product[i].category,
            vender_id: req.body.vender_id,
            customer_id: req.body.customer_id,
            product_name: product[i].product_name,
        });
    }
    Order.collection.insert(products, function (err, result) {
        if (err) {
            console.error(err);
            res.status(400).json({ success: false, msg: "product not select" });
            return;
        }
        else
        {
            res.status(HttpStatus.CREATED).json({
                success: true, 
                msg: "your order has been placed successfully",
                Count: result.insertedCount,
                Order: result.ops,
            });
            return;
        }
    });
});

/* customer List API */
router.get("/customerList", async (req, res) => {
    let data = await Customer.find({});
    if (data != undefined && data.length > 0) {
        res.status(HttpStatus.OK).json({ success: true, customer_list: data });
        return;
    }
    else
    {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, msg: "no Customer found.", data });
        return;
    }
});


/* placeOrder to vender API */
router.post("/placeOrder", async (req, res) => {
    if (req.body.vender_id == undefined || req.body.vender_id == null) {
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "vender_id can not be blank" });
        return;
    }
    if (req.body.customerNumber == undefined || req.body.customerNumber == null){
        res.status(HttpStatus.NOT_FOUND).json({ error_msg: "customerNumber can not be blank" });
        return;
    }
    var _id = req.body.vender_id;
    const venderDetails = await Vender.findOne({'_id': _id})
    var vender_number = venderDetails.phone
    // console.log('-> vender :', vender_number);
    var customerNumber = req.body.customerNumber;
    const orderData = await Order.find({ phone: customerNumber });
    var orders = [];
    for (var i = 0; i < orderData.length; i++)
    {
        orders.push({
            phone: orderData[i].phone,
            product_name: orderData[i].product_name,
            quantity: orderData[i].quantity,
            price: orderData[i].price,
        });
    }
    /* convert Object to string */
    let sendOredes = JSON.stringify(orders); 
    // console.log('->sendOredes:', sendOredes);
    axios.get("http://SMS.CREATORSDESIRE.IN/unified.php?key=1n9594wh341u41U1NWH39594&ph=" +
        vender_number +
        "&sndr=CDSIND&text=" +
        sendOredes
    ).then((result) => {
        if (result.status == 200) {
            // console.log(result);
            res.status(200).json({ success: true,  msg : result.data });
            return result;
        }
    }).catch((error) => {
        console.log(error);
    });
});


/* send Link By sms API */
router.post("/sendSMSLink", async (req, res) => {
    let PHONE = req.body.mobile_number;
    let MESSAGE = "https://play.google.com/store/apps/category/NEWS_AND_MAGAZINES";
    axios.get("http://SMS.CREATORSDESIRE.IN/unified.php?key=1n9594wh341u41U1NWH39594&ph=" +
        PHONE +
        "&sndr=CDSIND&text=" +
        MESSAGE
    ).then((result) => {
        if (result.status == 200) {
            // console.log(result);
            res.json({ success: true, msg: result.data });
            return result;
        }
    }).catch((error) => {
      console.log(error);
    });
});

/* Testing API */
router.post("/TestaddProductUsingMulter", upload.single("productImage"), (req, res, next) => {
    var correctedPath = path.normalize(req.file.path);
    correctedPath = correctedPath.replace(new RegExp(/\\/g), "/");

    productData = new itemsSchema({
        vender_id: req.body.vender_id,
        category_id: req.body.category_id,
        category_name: req.body.category_name,
        product_name: req.body.product_name,
        price: req.body.price,
        base64_image: clientUrl + "/" + correctedPath,
        created_at: moment().format("ll"),
    });
    productData.save().then((result) => {
        console.log(result);
        res.status(201).json({
            message: "created product successfully",
            Product: {
                product_id: result._id,
                vender_id: result.vender_id,
                category_id: result.category_id,
                category_name: result.category_name,
                product_name: result.product_name,
                price: result.price,
                request: {
                    type: "GET",
                    url: "http://localhost:3000/product/" + result._id,
                },
            },
        });
    })
    .catch((err) => {
        console.log(err);
        res.status(500).json({
            error: err,
        });
    });
});

// router.post('*', async (req, res) => {
// 	res.status(400).json({ msg: "Error! That route doesn`t exist. You are lost." });
// });

module.exports = router;
