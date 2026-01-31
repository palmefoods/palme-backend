const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: String,
    size: String,
    price: Number,
    weightKg: Number,
    description: String,
    image: String, 
    stock: { type: Number, default: 0 },
    
    
    discountCode: { type: String }, 
    discountPercent: { type: Number, default: 0 } 
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);