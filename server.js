require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const Order = require('./models/Order');
const Setting = require('./models/Setting');
const Location = require('./models/Location');
const SiteContent = require('./models/SiteContent'); 
const Product = require('./models/Product');
const User = require('./models/User');
const Coupon = require('./models/Coupon'); 


const authRoutes = require('./routes/authRoutes'); 
const uploadRoutes = require('./routes/uploadRoutes'); 
const { createOrder, getOrders, sendStatusEmail } = require('./controllers/orderController');

const app = express();


app.use(cors({
  origin: [
    "http://localhost:5173",                 
    "http://localhost:5174",  
    "https://palme-backend.vercel.app",
    "https://palme-client.vercel.app",       
    "https://palme-admin.vercel.app",
    "http://localhost:5000",
  ],
  credentials: true
}));
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));


app.use('/api/auth', authRoutes);     
app.use('/api/upload', uploadRoutes); 




app.get('/api/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: { $in: ['admin', 'editor'] } }).select('-password'); 
        res.json(admins);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admins', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const newUser = await User.create({
            name: "Admin User", 
            email,
            password,
            role: role === 'Editor' ? 'editor' : 'admin',
            phone: "0000000000"
        });
        res.json(newUser);
    } catch (err) { res.status(500).json({ error: "Failed to add admin." }); }
});

app.delete('/api/admins/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});




app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const newCoupon = new Coupon(req.body);
        await newCoupon.save();
        res.json(newCoupon);
    } catch (err) { 
        res.status(500).json({ error: err.code === 11000 ? "Coupon code already exists" : err.message }); 
    }
});

app.delete('/api/coupons/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/coupons/verify', async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        
        if (!coupon) return res.status(404).json({ valid: false, message: "Invalid Code" });
        if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ valid: false, message: "Coupon Usage Limit Reached" });

        res.json({ valid: true, discountPercent: coupon.discountPercentage, code: coupon.code });
    } catch (err) { res.status(500).json({ error: err.message }); }
});




app.get('/api/locations', async (req, res) => {
    try { const locations = await Location.find(); res.json(locations); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/locations', async (req, res) => {
    try { const newLocation = new Location(req.body); await newLocation.save(); res.json(newLocation); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/locations/:id', async (req, res) => {
    try { const updated = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/locations/:id', async (req, res) => {
    try { await Location.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});





app.get('/api/content/:type', async (req, res) => {
    try { const content = await SiteContent.find({ type: req.params.type }); res.json(content); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/content', async (req, res) => {
    try { const newItem = new SiteContent(req.body); await newItem.save(); res.json(newItem); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/content/:id', async (req, res) => {
    try { await SiteContent.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/products', async (req, res) => {
    try { const products = await Product.find(); res.json(products); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/products', async (req, res) => {
    try { const newProduct = new Product({...req.body, stock: Number(req.body.stock) || 0}); await newProduct.save(); res.status(201).json(newProduct); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/products/:id', async (req, res) => {
    try { const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {...req.body, stock: Number(req.body.stock) || 0}, { new: true }); res.json(updatedProduct); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/products/:id', async (req, res) => {
    try { await Product.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/settings', async (req, res) => {
    try { const settings = await Setting.find(); const formatted = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}); res.json(formatted); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/settings', async (req, res) => {
    try { const { key, value } = req.body; const setting = await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true }); res.json(setting); } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/orders', getOrders);
app.post('/api/orders', createOrder);
app.put('/api/orders/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.status || req.body.orderStatus }, { new: true });
        try { if(sendStatusEmail) await sendStatusEmail(updatedOrder); } catch(e) { console.error("Email fail", e); }
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/orders/:id', async (req, res) => {
    try { await Order.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});


app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            from: `"Newsletter System" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, 
            subject: `New Newsletter Subscriber`,
            html: `<p>A new user has subscribed to your newsletter: <strong>${email}</strong></p>`
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to subscribe" }); }
});

app.get("/", (req, res) => res.send("PalmeFoods API is running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));