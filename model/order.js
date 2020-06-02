const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({ 
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    category: {
        type: String,
        required: false,
    },
    product_name: {
        type: String, 
        required: false
    },
	price: {
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
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Order', OrderSchema)