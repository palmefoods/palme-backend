const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      size: String, 
      image: String 
    }
  ],
  totalAmount: { type: Number, required: true },

  
  orderStatus: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },

  
  deliveryMethod: { type: String, default: 'doorstep' }, 
  parkLocation: { type: String, default: '' },
  paymentReference: { type: String },
  paymentStatus: { type: String, default: 'Unpaid' }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);