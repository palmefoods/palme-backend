const mongoose = require('mongoose');

const SiteContentSchema = new mongoose.Schema({
  type: { type: String, required: true }, 
  data: { type: Object, required: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('SiteContent', SiteContentSchema);