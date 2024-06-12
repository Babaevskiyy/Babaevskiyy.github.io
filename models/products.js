const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    count: {
        type: String,
        required: true,
    },
    bought: {
        type: String,
        required: true,
    },
    sold: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
})
module.exports = mongoose.model("Product", productSchema);