const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const order_detailSchema = new Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    vender_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    order_no: {
        type: String, 
        required: false
    },
    client_name: {
        type: String, 
        required: false
    },
    phone: {
        type: String, 
        required: false
    },
    amount: {
        type: String, 
        required: false
    },
    created_at: {
        type: String,
    },
    updated_at: {
        type: String
    }
});


module.exports = mongoose.model('order_detail', order_detailSchema)