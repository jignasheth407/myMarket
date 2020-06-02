const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemsSchema = new Schema({ 
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    category_name: {
        type: String, 
        required: false
    },
    product_name: {
        type: String, 
        required: false
    },
	price: {
        type: String,
        required: false,
    },
    base64_image: {
        type: String,
        required: false
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Items', ItemsSchema)