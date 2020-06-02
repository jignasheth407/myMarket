const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    customer_name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
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
    created_at: {
        type: String,
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Customer', CustomerSchema);