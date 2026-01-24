const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    state: { type: String, required: true },   
    parkName: { type: String, required: true }, 
    address: { type: String, required: true },
    adminNote: { type: String },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Location', LocationSchema);