const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    vender_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    customer_name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: false
    },
    login_time: {
		type: String,
		required: false
    },   
    created_at: {
        type: String,
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Customer', CustomerSchema);