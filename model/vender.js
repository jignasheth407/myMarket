const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VenderSchema = new Schema({
    email: {
        type: String,
        unique: true,
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
    store_name: {
        type: String,
        required: false
    },
    vender_name: {
        type: String,
        required: false
    },    
    password: {
        type: String,
        required: false
    },
    icons_image: {
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

module.exports = mongoose.model('Vender', VenderSchema);