const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please add all fields (Name, Email, Password, Phone)' });
    }

    
    if (!process.env.JWT_SECRET) {
        console.error("❌ REGISTRATION BLOCKED: JWT_SECRET is missing in env vars.");
        return res.status(500).json({ message: "Server configuration error. Please contact support." });
    }

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const user = await User.create({
      name, email, password, phone, role: 'user'
    });

    if (user) {
      
      const token = generateToken(user._id);

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: token, 
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("❌ Register Error:", error.message); 
    
    
    if (error.code === 11000) {
        return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role, 
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    const resetToken = crypto.randomBytes(20).toString('hex');

    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    
    
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    try {
      await transporter.sendMail({
        from: `"Palme Security" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        html: `
            <h3>Password Reset</h3>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `
      });
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.error("Email Error:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password Updated Success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };