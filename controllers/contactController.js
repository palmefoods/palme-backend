const nodemailer = require('nodemailer');

const sendContactEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;

  
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, 
      replyTo: email, 
      to: 'oreo@palmefoods.com', 
      subject: `New Inquiry: ${subject || 'Contact Form Message'}`,
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          
          <div style="background-color: #2F5C3B; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">New Message</h1>
            <p style="color: #A3C9A8; margin: 5px 0 0; font-size: 14px;">Received from PalmeFoods Website</p>
          </div>

          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              You have received a new inquiry from the <strong>Contact Us</strong> page.
            </p>

            <div style="background-color: #f8f9fa; border-left: 4px solid #2F5C3B; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px; font-size: 14px;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 10px; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2F5C3B; text-decoration: none; font-weight: bold;">${email}</a></p>
              <p style="margin: 0; font-size: 14px;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            </div>

            <p style="font-weight: bold; margin-bottom: 10px;">Message:</p>
            <div style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-wrap; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px;">${message}</div>
          </div>

          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Palme Foods Admin System</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error("Contact Email Error:", error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = { sendContactEmail };