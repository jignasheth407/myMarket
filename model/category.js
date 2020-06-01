const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({ 
    category_name: {
        type: String,
		unique: true,
		required: true,
		trim: true
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Category', categorySchema)