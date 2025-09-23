const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Delivery notification email template
const createDeliveryNotificationTemplate = ({ firstName, lastName, trackingNumber, deliveredAt, receivedBy }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return {
    subject: `Package Delivered - ${trackingNumber} | Pong's Shipping Company`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2a44;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header .subtitle {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .body {
            padding: 32px 24px;
          }
          .delivery-status {
            background: linear-gradient(135deg, #d4f8e8 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 32px;
          }
          .status-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          .delivery-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
          }
          .detail-value {
            font-weight: 500;
            color: #1e293b;
            text-align: right;
          }
          .tracking-number {
            font-family: 'Courier New', monospace;
            background: #3b82f6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
          }
          .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #64748b;
          }
          .contact-info {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          .contact-info a {
            color: #3b82f6;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Package Delivered!</h1>
            <p class="subtitle">Your package has been successfully delivered</p>
          </div>

          <div class="body">
            <div class="delivery-status">
              <div class="status-icon">
                <span style="color: white; font-size: 32px;">✓</span>
              </div>
              <h2 style="margin: 0 0 8px 0; color: #065f46; font-size: 24px;">Delivery Confirmed</h2>
              <p style="margin: 0; color: #047857; font-size: 16px;">Your package has been delivered and signed for</p>
            </div>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Dear ${firstName} ${lastName},
            </p>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Great news! Your package with tracking number <span class="tracking-number">${trackingNumber}</span>
              has been successfully delivered and received.
            </p>

            <div class="delivery-details">
              <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px;">Delivery Details</h3>
              <div class="detail-row">
                <span class="detail-label">Tracking Number:</span>
                <span class="detail-value"><span class="tracking-number">${trackingNumber}</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Delivered On:</span>
                <span class="detail-value">${formatDate(deliveredAt)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Received By:</span>
                <span class="detail-value">${receivedBy}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Delivery Status:</span>
                <span class="detail-value" style="color: #10b981; font-weight: 600;">✓ Completed</span>
              </div>
            </div>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Thank you for choosing Pong's Shipping Company for your shipping needs. We hope you're satisfied with our service!
            </p>

            <p style="font-size: 16px; margin-bottom: 32px;">
              If you have any questions about this delivery or need assistance, please don't hesitate to contact us.
            </p>

            <div style="text-align: center;">
              <a href="mailto:shippingpongs@gmail.com" class="button">Contact Support</a>
            </div>
          </div>

          <div class="footer">
            <p><strong>Pong's Shipping Company</strong></p>
            <p>Your trusted bridge between the United States and Jamaica</p>

            <div class="contact-info">
              <p><strong>Contact Information:</strong></p>
              <p>📧 Email: <a href="mailto:shippingpongs@gmail.com">shippingpongs@gmail.com</a></p>
              <p>📞 Phone: <a href="tel:+18764559770">(876) 455-9770</a></p>
              <p>🏢 Main Office: Lot 6 Plantation Village, Priory, St. Ann</p>
              <p>📍 Pickup Location: Jack Ruby Plaza, James Avenue, Ocho Rios, St. Ann</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send delivery notification email
const sendDeliveryNotification = async ({ email, firstName, lastName, trackingNumber, deliveredAt, receivedBy }) => {
  try {
    const template = createDeliveryNotificationTemplate({
      firstName,
      lastName,
      trackingNumber,
      deliveredAt,
      receivedBy
    });

    const mailOptions = {
      from: `"Pong's Shipping Company" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Delivery notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending delivery notification email:', error);
    throw error;
  }
};

module.exports = {
  sendDeliveryNotification
};