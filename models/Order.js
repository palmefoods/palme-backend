const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String }
  },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      size: { type: String },
      image: { type: String },
      weightKg: { type: Number, default: 0 } 
    }
  ],
  deliveryMethod: { type: String, required: true }, 
  parkLocation: { type: String },
  
  
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  tipAmount: { type: Number, default: 0 }, 
  discountAmount: { type: Number, default: 0 }, 
  totalAmount: { type: Number, required: true },
  
  
  totalWeight: { type: Number, default: 0 },
  
  paymentReference: { type: String, required: true },
  paymentStatus: { type: String, default: 'Paid' },
  orderStatus: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);