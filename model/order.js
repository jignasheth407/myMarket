const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({ 
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
    category: {
        type: String,
        required: false,
    },
    // order_details: {
    //     type: [String],
    //     required: true
    // },
    product_name: {
        type: String, 
        required: false
    },
	price: {
        type: String,
        required: false,
    },
    quantity: {
        type: String,
        required: false,
    },
    phone: {
        type: String, 
        required: false
    },
    address: {
        type: String,
        required: false,
    },
    order_status: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Order', OrderSchema)