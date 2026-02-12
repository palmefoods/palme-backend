const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Setting = require('../models/Setting');
const axios = require('axios');
const nodemailer = require('nodemailer');





const sendEmail = async (order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    
    let shippingDisplay = "";
    if (order.deliveryMethod === 'doorstep') {
        shippingDisplay = order.customer.address;
    } else {
        shippingDisplay = `Pickup at: ${order.parkLocation || "Selected Park"}`;
    }

    const mailOptions = {
      from: `"Palme Foods" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject: `Order Confirmed: #${orderIdShort}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #1a4d2e; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">PALME FOODS</h1>
          </div>
  
          <div style="padding: 30px;">
              <h2 style="color: #1a4d2e; margin-top: 0; font-size: 20px;">Order Received</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
                  Hello <strong>${order.customer.name.split(' ')[0]}</strong>, we have received your payment.
              </p>
  
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 5px 0; font-size: 13px; color: #64748b;">Order ID: <strong style="color: #334155;">#${orderIdShort}</strong></p>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date: <strong style="color: #334155;">${date}</strong></p>
              </div>
  
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                  <thead>
                      <tr style="border-bottom: 2px solid #e5e7eb;">
                          <th style="text-align: left; padding: 10px 0; color: #1e293b; font-size: 13px; text-transform: uppercase;">Item</th>
                          <th style="text-align: right; padding: 10px 0; color: #1e293b; font-size: 13px; text-transform: uppercase;">Total</th>
                      </tr>
                  </thead>
                  <tbody>
                  ${order.items.map(item => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 15px 0; display: flex; align-items: center; gap: 15px;">
                              ${item.image ? `<img src="${item.image}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" />` : ''}
                              <div>
                                  <span style="display: block; font-weight: bold; color: #334155; font-size: 14px;">${item.name}</span>
                                  <span style="font-size: 12px; color: #64748b;">Size: ${item.size} | Qty: ${item.quantity}</span>
                              </div>
                          </td>
                          <td style="text-align: right; padding: 15px 0; font-weight: bold; color: #334155;">₦${(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                  `).join('')}
                  </tbody>
                  <tfoot>
                      <tr>
                          <td colspan="2" style="padding-top:10px; border-top:1px solid #eee;"></td>
                      </tr>
                      <tr>
                          <td style="padding: 5px 0; color: #64748b;">Subtotal</td>
                          <td style="text-align: right; color: #334155;">₦${order.subtotal.toLocaleString()}</td>
                      </tr>
  
                      ${order.shippingFee > 0 ? `
                      <tr>
                          <td style="padding: 5px 0; color: #64748b;">Delivery Fee</td>
                          <td style="text-align: right; color: #334155;">₦${order.shippingFee.toLocaleString()}</td>
                      </tr>
                      ` : ''}
  
                      ${order.discountAmount > 0 ? `
                      <tr>
                          <td style="padding: 5px 0; color: #16a34a;">Discount</td>
                          <td style="text-align: right; color: #16a34a;">-₦${order.discountAmount.toLocaleString()}</td>
                      </tr>` : ''}
                      
                      <tr>
                          <td style="padding-top: 15px; font-weight: bold; color: #1a4d2e; font-size: 16px;">TOTAL PAID</td>
                          <td style="text-align: right; padding-top: 15px; font-weight: bold; font-size: 20px; color: #1a4d2e;">₦${order.totalAmount.toLocaleString()}</td>
                      </tr>
                  </tfoot>
              </table>
  
              <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                  <p style="margin: 0; color: #475569; font-size: 15px;"><strong>Delivering to:</strong> ${shippingDisplay}</p>
                  <p style="margin: 5px 0 0 0; color: #475569; font-size: 15px;">${order.customer.phone}</p>
              </div>
          </div>
        </div>
      `
    };
  
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send order email:", error.message);
  }
};

const sendStatusEmail = async (order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  
    const isShipped = order.orderStatus === 'Shipped';
    const isDelivered = order.orderStatus === 'Delivered';
    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
  
    const mailOptions = {
      from: `"Palme Foods" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject: `Update: Order #${orderIdShort} is ${order.orderStatus}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #1a4d2e; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PALME FOODS</h1>
          </div>
          <div style="padding: 30px;">
              <h2 style="color: #1a4d2e; font-size: 20px; margin-top: 0;">Order Update</h2>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                  Your order <strong>#${orderIdShort}</strong> has been updated to: 
                  <span style="color: #ffffff; background-color: #1a4d2e; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase;">${order.orderStatus}</span>
              </p>
              
              ${isShipped ? `
              <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <p style="margin: 0; color: #166534; font-weight: bold;">📦 Order Shipped</p>
                  <p style="margin: 5px 0 0 0; color: #374151; font-size: 14px;">
                      Your premium palm oil is on its way. If you selected Park Pickup, please keep your phone on.
                  </p>
              </div>
              ` : ''}
  
              ${isDelivered ? `
              <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <p style="margin: 0; color: #166534; font-weight: bold;">✅ Order Delivered</p>
                  <p style="margin: 5px 0 0 0; color: #374151; font-size: 14px;">
                      Thank you for shopping with Palme Foods. We hope you enjoy the taste of quality!
                  </p>
              </div>
              ` : ''}
          </div>
        </div>
      `
    };
  
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send status email:", error.message);
  }
};






const createOrder = async (req, res) => {
  console.log("🔥 Create Order Triggered");

  try {
    const { customer, items, deliveryMethod, parkLocation, paymentReference, couponCode, tip } = req.body;
    
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const verification = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
    });

    if (verification.data.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed." });
    }

    const amountPaid = verification.data.data.amount / 100; 

    
    let calculatedSubtotal = 0;
    let totalWeight = 0;
    let finalItems = [];

    for (const item of items) {
        const product = await Product.findOne({ name: item.name });
        
        if (!product) continue;

        const qty = item.qty || item.quantity;
        if (product.stock < qty) {
            return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
        }

        
        product.stock -= qty;
        await product.save();

        const itemWeight = (product.weightKg || 0) * qty;
        calculatedSubtotal += product.price * qty;
        totalWeight += itemWeight;

        finalItems.push({
            name: product.name,
            quantity: qty,
            price: product.price,
            size: product.size,
            image: product.image,
            weightKg: product.weightKg || 0
        });
    }

    
    let discountAmount = 0;
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon && coupon.usedCount < coupon.maxUses) {
            discountAmount = (calculatedSubtotal * coupon.discountPercentage) / 100;
            coupon.usedCount += 1;
            await coupon.save();
        }
    }

    const tipAmount = Number(tip) || 0;

    
    
    let expectedTotal = calculatedSubtotal + tipAmount - discountAmount;
    let shippingFee = 0;

    if (amountPaid > expectedTotal) {
        shippingFee = amountPaid - expectedTotal;
    }

    
    const finalTotal = amountPaid; 

    
    const newOrder = new Order({
      customer,
      items: finalItems,
      deliveryMethod,
      parkLocation: deliveryMethod === 'park' ? parkLocation : '',
      
      subtotal: calculatedSubtotal,
      shippingFee: shippingFee,
      discountAmount,
      tipAmount,
      totalAmount: finalTotal,
      totalWeight,

      paymentReference,
      paymentStatus: 'Paid',
      orderStatus: 'Pending'
    });

    const savedOrder = await newOrder.save();

    
    sendEmail(savedOrder);

    res.status(201).json({ success: true, order: savedOrder });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: error.message });
  }
};


const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
};


const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.orderStatus = req.body.status || order.orderStatus;
            
            
            if (req.body.status === 'Delivered') {
                order.paymentStatus = 'Paid';
            }

            const updatedOrder = await order.save();
            
            
            sendStatusEmail(updatedOrder);

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const myOrders = async (req, res) => {
    try {
        
        
        const orders = await Order.find({ 'customer.email': req.user.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await order.deleteOne();
            res.json({ message: 'Order removed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createOrder, 
    getOrders, 
    getOrderById,
    updateOrderStatus,
    myOrders,
    deleteOrder,
    sendEmail, 
    sendStatusEmail 
};