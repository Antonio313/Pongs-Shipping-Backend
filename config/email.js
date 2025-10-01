const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// SendGrid email sending (primary method)
const sendEmailViaSendGrid = async (to, subject, html) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid API key not configured');
    return null;
  }

  try {
    console.log('📧 Using SendGrid for email delivery...');
    console.log('  From:', process.env.SMTP_FROM || 'noreply@pongsshipping.com');
    console.log('  To:', to);
    console.log('  Subject:', subject);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: to,
      from: process.env.SMTP_FROM || 'noreply@pongsshipping.com',
      subject: subject,
      html: html,
    };

    const result = await sgMail.send(msg);

    console.log('✅ SendGrid email sent successfully!');
    console.log('  Status Code:', result[0].statusCode);
    console.log('  Message ID:', result[0].headers['x-message-id']);

    return true;
  } catch (error) {
    console.error('❌ SendGrid failed:', error.message);

    // Handle specific SendGrid errors
    if (error.response) {
      console.error('  Status Code:', error.response.statusCode);
      console.error('  Error Body:', error.response.body);

      if (error.response.body && error.response.body.errors) {
        error.response.body.errors.forEach((err, index) => {
          console.error(`  Error ${index + 1}:`, err.message);
        });
      }
    }

    return null;
  }
};

// Gmail SMTP email sending (fallback method)
const sendEmailViaGmailSMTP = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Gmail SMTP credentials not configured');
    return null;
  }

  try {
    console.log('📧 Using Gmail SMTP for email delivery...');
    console.log('  SMTP User:', process.env.SMTP_USER);
    console.log('  To:', to);

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // App password, not regular password
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    };

    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    console.log('🚀 Sending email via Gmail SMTP...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Gmail SMTP email sent successfully!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);

    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP failed:', error.message);
    console.error('  Error code:', error.code);

    // Helpful error messages
    if (error.code === 'EAUTH') {
      console.error('  Authentication failed. Please check:');
      console.error('  - SMTP_USER is correct');
      console.error('  - SMTP_PASS is an App Password (not regular password)');
      console.error('  - 2FA is enabled on the Google account');
      console.error('  - Less secure app access is enabled (if not using App Password)');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('  Connection failed. SMTP might be blocked by hosting provider.');
    }

    return null;
  }
};

// Email templates
const emailTemplates = {
  verification: (name, verificationLink) => ({
    subject: 'Verify Your Email - Pongs Shipping Company',
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #2563eb;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2a44;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 12px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.3s ease;
          }
          .button:hover {
            background: #1d4ed8;
          }
          .link-text {
            font-size: 14px;
            color: #4b5563;
            word-break: break-all;
          }
          .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .hyperlink {
          color: #ffffffff;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 20px; }
            .content h2 { font-size: 18px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pongs Shipping Company</h1>
          </div>
          <div class="content">
            <h2>Email Verification</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering with Pongs Shipping Company. Please verify your email address to activate your account.</p>
            <p>
              <a class="hyperlink" href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link-text">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with Pongs Shipping Company, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pongs Shipping Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  statusUpdate: (userName, trackingNumber, status, packageDescription) => ({
    subject: `Package Status Update - ${trackingNumber}`,
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #2563eb;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2a44;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 12px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #059669;
            color: #ffffff;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
          }
          .details-box {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 20px; }
            .content h2 { font-size: 18px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pongs Shipping Company</h1>
          </div>
          <div class="content">
            <h2>Package Status Update</h2>
            <p>Hello ${userName},</p>
            <p>Your package <strong>${packageDescription}</strong> has a new status update.</p>

            <div class="details-box">
              <h3 style="margin-top: 0; color: #2563eb;">Package Details</h3>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              <p><strong>Status:</strong> <span class="status-badge">${status}</span></p>
            </div>

            <p>Track your package anytime through your customer dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pongs Shipping Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  prealertConfirmation: (userName, trackingNumber, status, packageDescription) => ({
    subject: `Pre-Alert Confirmed - Package Created ${trackingNumber}`,
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #059669;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2a44;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 12px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #059669;
            color: #ffffff;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
          }
          .tracking-number {
            font-size: 18px;
            font-weight: 600;
            color: #2563eb;
            background: #f0f9ff;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            margin: 16px 0;
          }
          .details-box {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #059669;
          }
          .content ul {
            padding-left: 20px;
            margin: 16px 0;
          }
          .content ul li {
            margin-bottom: 8px;
            font-size: 16px;
          }
          .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 20px; }
            .content h2 { font-size: 18px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Pre-Alert Confirmed!</h1>
            <p>Pongs Shipping Company</p>
          </div>
          <div class="content">
            <h2>Great News, ${userName}!</h2>
            <p>Your pre-alert has been confirmed, and we've created a package for your shipment.</p>

            <div class="details-box">
              <h3 style="margin-top: 0; color: #059669;">Package Details</h3>
              <p><strong>Description:</strong> ${packageDescription}</p>
              <div class="tracking-number">Tracking Number: ${trackingNumber}</div>
              <p><strong>Current Status:</strong> <span class="status-badge">${status}</span></p>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your package is now in our system and being processed.</li>
              <li>You'll receive email updates as your package moves through our network.</li>
              <li>Track your package anytime using your tracking number.</li>
              <li>Log into your customer dashboard for detailed tracking information.</li>
            </ul>

            <p><strong>Stay Updated:</strong> We'll notify you at each major step of your package's journey.</p>

            <p>Thank you for choosing Pongs Shipping Company!</p>
          </div>
          <div class="footer">
            <p>Questions? Contact our customer service team.</p>
            <p>&copy; ${new Date().getFullYear()} Pongs Shipping Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  missingPreAlert: (userName, packageDetails) => ({
    subject: '🚨 URGENT: Package Received Without Pre-Alert - Action Required',
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #dc2626;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2a44;
            margin-top: 0;
          }
          .content h3 {
            font-size: 18px;
            font-weight: 600;
            color: #dc2626;
            margin-top: 20px;
          }
          .content p {
            font-size: 16px;
            margin: 12px 0;
          }
          .urgent-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #dc2626;
            color: #ffffff;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .package-details {
            background: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
          }
          .warning-box {
            background: #fef2f2;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #dc2626;
            margin: 16px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background: #dc2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s ease;
          }
          .cta-button:hover {
            background: #b91c1c;
          }
          .content ol {
            padding-left: 20px;
            margin: 16px 0;
          }
          .content ol li {
            margin-bottom: 8px;
            font-size: 16px;
          }
          .content ul {
            padding-left: 20px;
            margin: 12px 0;
          }
          .content ul li {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 20px; }
            .content h2 { font-size: 18px; }
            .content h3 { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 URGENT: Action Required</h1>
            <p>Pongs Shipping Company</p>
          </div>
          <div class="content">
            <div class="urgent-badge">IMMEDIATE ATTENTION NEEDED</div>

            <h2>Hello ${userName},</h2>
            <p>We have received a package at our Florida warehouse, but <strong>no pre-alert</strong> was submitted in our system.</p>

            <div class="package-details">
              <h3 style="margin-top: 0;">Package Details</h3>
              <p><strong>Description:</strong> ${packageDetails.description}</p>
              ${packageDetails.weight ? `<p><strong>Weight:</strong> ${packageDetails.weight} kg</p>` : ''}
              ${packageDetails.tracking_number ? `<p><strong>Tracking Number:</strong> ${packageDetails.tracking_number}</p>` : ''}
              ${packageDetails.carrier ? `<p><strong>Carrier:</strong> ${packageDetails.carrier}</p>` : ''}
              ${packageDetails.notes ? `<p><strong>Notes:</strong> ${packageDetails.notes}</p>` : ''}
            </div>

            <h3>⚠️ Package Held at Customs</h3>
            <p>Your package cannot proceed until you take the following actions:</p>

            <ol>
              <li><strong>Immediately</strong> create a pre-alert in our system.</li>
              <li>Upload the purchase receipt/invoice.</li>
              <li>Provide accurate package details.</li>
            </ol>

            <div class="warning-box">
              <p><strong>⏰ Time-Sensitive:</strong> Packages without pre-alerts may face:</p>
              <ul>
                <li>Customs delays and storage fees</li>
                <li>Potential return to sender after 7 days</li>
                <li>Additional verification requirements</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customerDashboard" class="cta-button">
                Create Pre-Alert Now
              </a>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
                This link directs you to the pre-alert creation page.
              </p>
            </div>

            <p><strong>Need Assistance?</strong> Contact our support team immediately:</p>
            <ul>
              <li>📞 Phone: ${process.env.SUPPORT_PHONE || '1-876-455-9770'}</li>
              <li>✉️ Email: ${process.env.SUPPORT_EMAIL || 'shippingpongs@gmail.com'}</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pongs Shipping Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  arrivedInJamaicaWithCost: (userName, trackingNumber, packageDescription, finalCost, branch) => ({
    subject: `📦 Package Arrived in Jamaica - Final Cost: $${finalCost} - ${trackingNumber}`,
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
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #7c3aed;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2a44;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 12px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #7c3aed;
            color: #ffffff;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
          }
          .tracking-number {
            font-size: 18px;
            font-weight: 600;
            color: #2563eb;
            background: #f0f9ff;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            margin: 16px 0;
          }
          .cost-highlight {
            font-size: 24px;
            font-weight: 700;
            color: #dc2626;
            background: #fef2f2;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            border: 2px solid #dc2626;
          }
          .details-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #7c3aed;
          }
          .next-steps {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #059669;
          }
          .content ul {
            padding-left: 20px;
            margin: 16px 0;
          }
          .content ul li {
            margin-bottom: 8px;
            font-size: 16px;
          }
          .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 20px; }
            .content h2 { font-size: 18px; }
            .cost-highlight { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🇯🇲 Package Arrived in Jamaica!</h1>
            <p>Pongs Shipping Company</p>
          </div>
          <div class="content">
            <h2>Great News, ${userName}!</h2>
            <p>Your package has successfully arrived in Jamaica and has cleared customs. Here are the final details:</p>

            <div class="tracking-number">Tracking: ${trackingNumber}</div>

            <div class="details-box">
              <h3 style="margin-top: 0; color: #7c3aed;">Package Information</h3>
              <p><strong>Description:</strong> ${packageDescription}</p>
              <p><strong>Current Status:</strong> <span class="status-badge">Arrived in Jamaica</span></p>
              <p><strong>Destination Branch:</strong> ${branch}</p>
            </div>

            <div class="cost-highlight">
              <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Final Landing Cost</div>
              <div>$${finalCost}</div>
              <div style="font-size: 12px; font-weight: 400; margin-top: 8px; color: #6b7280;">
                (Includes customs fees and local shipping)
              </div>
            </div>

            <div class="next-steps">
              <h3 style="margin-top: 0; color: #059669;">📋 Next Steps</h3>
              <ul style="margin: 0;">
                <li><strong>Payment:</strong> Please prepare to pay the final landing cost of <strong>$${finalCost}</strong> when collecting your package</li>
                <li><strong>Collection:</strong> Your package will be transferred to ${branch} branch for pickup</li>
                <li><strong>Notification:</strong> You'll receive another notification when ready for pickup</li>
                <li><strong>Documents:</strong> Please bring valid ID when collecting</li>
              </ul>
            </div>

            <p><strong>Questions?</strong> Contact us:</p>
            <ul>
              <li>📞 Phone: ${process.env.SUPPORT_PHONE || '1-876-455-9770'}</li>
              <li>✉️ Email: ${process.env.SUPPORT_EMAIL || 'shippingpongs@gmail.com'}</li>
            </ul>

            <p>Thank you for choosing Pongs Shipping Company!</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pongs Shipping Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main send email function with fallback logic
const sendEmail = async (to, subject, html) => {
  console.log('📤 Attempting to send email...');
  console.log('  To:', to);
  console.log('  Subject:', subject);

  // Try SendGrid first (primary method)
  if (process.env.SENDGRID_API_KEY) {
    console.log('🔄 Attempting SendGrid (Primary)...');
    const sendGridResult = await sendEmailViaSendGrid(to, subject, html);
    if (sendGridResult) {
      return true;
    }
    console.log('⚠️ SendGrid failed, trying fallback...');
  } else {
    console.log('⚠️ SendGrid API key not configured, trying Gmail SMTP...');
  }

  // Try Gmail SMTP as fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('🔄 Attempting Gmail SMTP (Fallback)...');
    const gmailResult = await sendEmailViaGmailSMTP(to, subject, html);
    if (gmailResult) {
      return true;
    }
    console.log('⚠️ Gmail SMTP failed...');
  } else {
    console.log('⚠️ Gmail SMTP credentials not configured...');
  }

  console.error('❌ All email services failed. Email not sent to:', to);
  console.error('   Please configure either:');
  console.error('   1. SENDGRID_API_KEY (recommended)');
  console.error('   2. SMTP_USER and SMTP_PASS (Gmail App Password)');
  return false;
};

// Test email function for debugging
const testEmail = async (to = 'test@example.com') => {
  console.log('🧪 Testing email functionality...');
  console.log('  Configured services:');
  console.log('    - SendGrid:', process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured');
  console.log('    - Gmail SMTP:', (process.env.SMTP_USER && process.env.SMTP_PASS) ? '✅ Configured' : '❌ Not configured');

  const testTemplate = {
    subject: 'Test Email - Pongs Shipping',
    html: `
      <h2>Email Test</h2>
      <p>This is a test email to verify email configuration.</p>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Environment: ${process.env.NODE_ENV}</p>
      <hr>
      <p><strong>Configuration Status:</strong></p>
      <ul>
        <li>SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}</li>
        <li>Gmail SMTP: ${(process.env.SMTP_USER && process.env.SMTP_PASS) ? '✅ Configured' : '❌ Not configured'}</li>
      </ul>
    `
  };

  return await sendEmail(to, testTemplate.subject, testTemplate.html);
};

module.exports = {
  emailTemplates,
  sendEmail,
  testEmail
};
