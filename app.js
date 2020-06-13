var cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
var createError = require("http-errors");
var express = require("express");
var flash = require("req-flash");
var logger = require("morgan");
var path = require("path");
var cors = require("cors");
var md5 = require("md5");

/* Database connection */
require("./mongo");

/* require all Models */
require("./model/admin");
require("./model/users");
require("./model/forgotpass");
require("./model/user_groups");
require("./model/items");
require("./model/category");
require("./model/vender");
require("./model/customer");
require("./model/order");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var supportRouter = require("./routes/supportapi");

var app = express();

app.use(
  session({
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 6000000 },
  })
);

app.use(flash());

app.use(cors());

/* view engine setup */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// app.use(function (req, res, next) {
//   var allowedOrigins = ['http://127.0.0.1:8080', 'http://45.35.190.38', 'http://45.35.190.38:80', 'http://localhost:3000','http://localhost'];
//   var origin = req.headers.source;
//   var deviceid = req.headers.deviceid;
//   console.log("Origin: " + origin);
//   console.log("device: " + deviceid);
//     if(allowedOrigins.indexOf(origin) > -1){
//         res.setHeader('Access-Control-Allow-Origin', '*');
//     }
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, OPTIONS','POST','PUT');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, source, deviceid');
//     res.header('Access-Control-Allow-Credentials', true);
//     next();
// });

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", supportRouter);

/* catch 404 and forward to error handler */

app.use(function (req, res, next) {
  next(createError(404));
});

/* error handler */

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
