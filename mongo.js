const mongoose = require("mongoose");

require("dotenv").config();
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOURI, { useCreateIndex: true, useNewUrlParser: true });


// const mongoose = require("mongoose");
// require("dotenv").config();
// mongoose.Promise = global.Promise;

// const MONGOLAB_URI = "mongodb+srv://admin:admin@123@cluster0-b8bnt.mongodb.net/binanceDB?retryWrites=true&w=majority"

// mongoose.connect(MONGOLAB_URI, {useCreateIndex: true, useNewUrlParser: true})
// .then(() => console.log('Mongodb connected.'))
// .catch(e => console.log(e));