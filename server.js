require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const Order = require('./models/Order');
const Setting = require('./models/Setting');
const Admin = require('./models/Admin');
const Location = require('./models/Location');
const SiteContent = require('./models/SiteContent'); 
const Product = require('./models/Product');
const User = require('./models/User');


const authRoutes = require('./routes/authRoutes'); 
const uploadRoutes = require('./routes/uploadRoutes'); 
const { createOrder, getOrders } = require('./controllers/orderController');

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));


app.use('/api/auth', authRoutes);     
app.use('/api/upload', uploadRoutes); 


app.get('/api/content/:type', async (req, res) => {
    try {
        const content = await SiteContent.find({ type: req.params.type });
        res.json(content);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/content', async (req, res) => {
    try {
        const newItem = new SiteContent(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/content/:id', async (req, res) => {
    try {
        await SiteContent.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/orders', getOrders);
app.post('/api/orders', createOrder);

app.put('/api/orders/:id', async (req, res) => {
  console.log("🔄 Updating Order:", req.params.id);
  console.log("📦 New Data:", req.body);

  try {
    
    const newStatus = req.body.status || req.body.orderStatus;

    if (!newStatus) {
        return res.status(400).json({ message: "Status is required" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { orderStatus: newStatus }, 
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    
    const orderController = require('./controllers/orderController');
    try {
      if(orderController.sendStatusEmail) {
          await orderController.sendStatusEmail(updatedOrder);
          console.log(`✅ Email sent to ${updatedOrder.customer.email}`);
      } else {
          console.error("❌ sendStatusEmail function not found in controller");
      }
    } catch (emailErr) {
      console.error("⚠️ Email failed:", emailErr.message);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find({ isActive: true });
        res.json(locations);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/locations', async (req, res) => {
    try {
        const newLocation = new Location(req.body);
        await newLocation.save();
        res.json(newLocation);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product({
            ...req.body,
            stock: Number(req.body.stock) || 0
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            stock: Number(req.body.stock) || 0
        };
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            updatedData, 
            { new: true }
        );
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/settings', async (req, res) => {
    try {
        const settings = await Setting.find();
        const formatted = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        res.json(formatted);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
        res.json(setting);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/admins', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password'); 
        res.json(admins);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admins', async (req, res) => {
    try {
        const newAdmin = new Admin(req.body);
        await newAdmin.save();
        res.json(newAdmin);
    } catch (err) { res.status(500).json({ error: "Failed to add admin." }); }
});

app.delete('/api/admins/:id', async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.post('/api/custom-request', async (req, res) => {
    try {
        const { name, email, phone, businessName, productType, quantity, message } = req.body;
        
        
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `"Website Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, 
            subject: `📢 New Bulk Order: ${productType}`,
            html: `
                <h3>New Bulk Order Request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Business:</strong> ${businessName || "N/A"}</p>
                <hr/>
                <p><strong>Product:</strong> ${productType}</p>
                <p><strong>Quantity:</strong> ${quantity}</p>
                <p><strong>Message:</strong><br/>${message}</p>
            `
        });

        res.json({ success: true, message: "Quote sent" });

    } catch (err) {
        console.error("Bulk Email Error:", err);
        res.status(500).json({ error: "Failed to send email" });
    }
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
            subject: `🔔 New Newsletter Subscriber`,
            html: `<p>A new user has subscribed to your newsletter: <strong>${email}</strong></p>`
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to subscribe" });
    }
});

app.get("/", (req, res) => res.send("PalmeFoods API is running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));