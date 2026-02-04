require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); 

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    
    const existingAdmin = await User.findOne({ email: "admin@palmefoods.com" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit();
    }

    
    const admin = new User({
      name: "Super Admin",
      email: "admin@palmefoods.com",
      password: "admin123", 
      role: "admin"
    });

    await admin.save();
    console.log(" Admin Created Successfully!");
    console.log("Email: admin@palmefoods.com");
    console.log("Password: admin123");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedAdmin();