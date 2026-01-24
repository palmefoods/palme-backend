require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Location = require('./models/Location');

const app = express();


app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));






app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find({ isActive: true });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/locations', async (req, res) => {
    try {
        const newLocation = new Location(req.body);
        await newLocation.save();
        res.json(newLocation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/delivery/calculate', async (req, res) => {
    const { deliveryType, locationId, productWeightKg } = req.body;

    let response = {
        finalNote: "",
        shippingCost: 0
    };

    if (deliveryType === 'doorstep') {
        
        response.shippingCost = productWeightKg * 1000; 
        response.finalNote = `Doorstep Delivery selected. A logistics partner will contact you. Shipping calculated at ${productWeightKg}kg.`;
    } 
    else if (deliveryType === 'park') {
        
        try {
            const park = await Location.findById(locationId);
            if (park) {
                response.shippingCost = 500; 
                response.finalNote = `Pickup at ${park.parkName}. NOTE: ${park.adminNote}`;
            }
        } catch (err) {
            return res.status(404).json({ error: "Park not found" });
        }
    }

    res.json(response);
});


const ProductSchema = new mongoose.Schema({
    name: String,
    size: String,
    price: Number,
    weightKg: Number,
    description: String,
});
const Product = mongoose.model('Product', ProductSchema);
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
        console.log("✅ Product Added:", newProduct.name);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
app.get("/", (req, res) => {
  res.send("PalmeFoods API is running successfully!");
});
module.exports = app;