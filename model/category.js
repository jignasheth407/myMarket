const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    vender_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    category_name: {
        type: String,
		required: true
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Category', categorySchema)