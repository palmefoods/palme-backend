const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  state: { type: String }, 
  type: { 
    type: String, 
    enum: ['Doorstep', 'Pickup Station', 'park'], 
    default: 'Pickup Station' 
  },
  basePrice: { type: Number, default: 0 }, 
  isActive: { type: Boolean, default: true },
  address: String, 
  adminNote: String 
}, { timestamps: true });

module.exports = mongoose.model('Location', LocationSchema);