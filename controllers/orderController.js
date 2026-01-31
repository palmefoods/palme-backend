const Order = require('../models/Order');
const Product = require('../models/Product');
const axios = require('axios');
const nodemailer = require('nodemailer');




const sendEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const orderIdShort = order._id.toString().slice(-6).toUpperCase();
  
  
  let shippingDisplay = "";
  let shippingTitle = "";
  
  if (order.deliveryMethod === 'doorstep') {
      shippingTitle = "Doorstep Delivery Address";
      shippingDisplay = order.customer.address;
  } else {
      shippingTitle = "Park Pickup Details";
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
                Hello <strong>${order.customer.name.split(' ')[0]}</strong>, we have received your payment and are preparing your order for shipment.
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
                        <td style="padding-top: 20px; font-weight: bold; color: #1a4d2e; font-size: 16px;">TOTAL PAID</td>
                        <td style="text-align: right; padding-top: 20px; font-weight: bold; font-size: 20px; color: #1a4d2e;">₦${order.totalAmount.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #334155; text-transform: uppercase; margin-bottom: 8px;">${shippingTitle}</h3>
                <p style="margin: 0; color: #475569; font-size: 15px;">${shippingDisplay}</p>
                <p style="margin: 5px 0 0 0; color: #475569; font-size: 15px;">${order.customer.phone}</p>
            </div>

           <div style="margin-top: 40px; background-color: #f8fafc; border-top: 4px solid #1a4d2e; padding: 40px 20px; text-align: center;">
    
    <div style="margin-bottom: 20px;">
        <a href="https://instagram.com" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">Instagram</a>
        <span style="color: #cbd5e1;">|</span>
        <a href="https://facebook.com" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">Facebook</a>
        <span style="color: #cbd5e1;">|</span>
        <a href="https://wa.me/+2349134033103" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">WhatsApp</a>
    </div>

    <p style="color: #64748b; font-size: 12px; margin-bottom: 10px; line-height: 1.6;">
        <strong>Palme Foods Nigeria</strong><br/>
        Ibadan, Oyo State.
    </p>

    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        You received this email because you purchased from Palme Foods.<br/>
        © ${new Date().getFullYear()} All rights reserved.
    </p>
</div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};




const sendStatusEmail = async (order) => {
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
                    Your premium palm oil is on its way. If you selected Park Pickup, please keep your phone on. If Doorstep, our dispatch rider will contact you soon.
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

            <div style="margin-top: 40px; background-color: #f8fafc; border-top: 4px solid #1a4d2e; padding: 40px 20px; text-align: center;">
    
                <div style="margin-bottom: 20px;">
                    <a href="https://instagram.com" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">Instagram</a>
                    <span style="color: #cbd5e1;">|</span>
                    <a href="https://facebook.com" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">Facebook</a>
                    <span style="color: #cbd5e1;">|</span>
                    <a href="https://wa.me/+2349134033103" style="text-decoration: none; margin: 0 10px; color: #1a4d2e; font-weight: bold; font-size: 14px;">WhatsApp</a>
                </div>

                <p style="color: #64748b; font-size: 12px; margin-bottom: 10px; line-height: 1.6;">
                    <strong>Palme Foods Nigeria</strong><br/>
                    Ibadan, Oyo State.
                </p>

                <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                    You received this email because you purchased from Palme Foods.<br/>
                    © ${new Date().getFullYear()} All rights reserved.
                </p>
            </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};




const createOrder = async (req, res) => {
  console.log("🔥 Create Order Triggered");

  try {
    const { customer, items, deliveryMethod, parkLocation, totalAmount, paymentReference } = req.body;
    
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const verification = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
    });

    if (verification.data.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed." });
    }

    
    for (const item of items) {
        const product = await Product.findOne({ name: item.name });
        if (product) {
            if (product.stock < (item.qty || item.quantity)) {
                return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
            }
            product.stock -= (item.qty || item.quantity);
            await product.save();

            
            if (product.stock <= 5) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });
                await transporter.sendMail({
                    from: `"System Alert" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: `⚠️ Low Stock: ${product.name}`,
                    html: `<p>Stock for <b>${product.name}</b> is down to <b>${product.stock}</b>.</p>`
                });
            }
        }
    }

    
    const newOrder = new Order({
      customer,
      items: items.map(i => ({
          name: i.name,
          quantity: i.qty || i.quantity,
          price: i.price,
          size: i.size,
          image: i.image 
      })),
      deliveryMethod,
      parkLocation: deliveryMethod === 'park' ? parkLocation : '', 
      totalAmount,
      paymentReference,
      paymentStatus: 'Paid',
      orderStatus: 'Pending'
    });

    const savedOrder = await newOrder.save();

    
    try { await sendEmail(savedOrder); } catch (e) { console.error("Email Error:", e.message); }

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

module.exports = { createOrder, getOrders, sendEmail, sendStatusEmail };