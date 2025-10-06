const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuration du transporteur SMTP
const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    logger.warn('SMTP configuration not found. Email service disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

/**
 * Template HTML de base pour les emails
 */
const getEmailTemplate = (content, isRTL = false, language = 'en') => {
  return `
    <!DOCTYPE html>
    <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: ${isRTL ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"};
          line-height: 1.6;
          color: #333333;
          background-color: #f5f7fa;
          margin: 0;
          padding: 0;
        }
        .email-wrapper {
          width: 100%;
          padding: 20px;
          background-color: #f5f7fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .header p {
          font-size: 16px;
          margin-top: 8px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
          text-align: ${isRTL ? 'right' : 'left'};
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #4b5563;
          margin-bottom: 24px;
          line-height: 1.7;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 36px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          transition: transform 0.2s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .link-section {
          margin-top: 24px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .link-section p {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .link {
          color: #3b82f6;
          word-break: break-all;
          font-size: 13px;
          text-decoration: none;
        }
        .features {
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border-left: 4px solid #3b82f6;
        }
        .features-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }
        .feature-item {
          padding: 10px 0;
          font-size: 14px;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .warning-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .warning-box p {
          font-size: 14px;
          color: #92400e;
          margin: 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 13px;
          color: #6b7280;
          margin: 8px 0;
        }
        .footer-links {
          margin-top: 16px;
        }
        .footer-links a {
          color: #3b82f6;
          text-decoration: none;
          margin: 0 10px;
          font-size: 13px;
        }
        @media only screen and (max-width: 600px) {
          .email-wrapper {
            padding: 10px;
          }
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${content}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Fonction générique pour envoyer des emails
 */
const sendEmail = async (mailOptions) => {
  if (!transporter) {
    logger.warn('Email not sent: SMTP not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"AI Chatbot" <noreply@aichat.com>',
      ...mailOptions,
    });

    logger.info(`Email sent successfully to ${mailOptions.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${mailOptions.to}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Envoyer un email de vérification
 */
const sendVerificationEmail = async (email, token, language = 'en') => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

  const translations = {
    en: {
      subject: 'Verify Your Email - AI Chatbot',
      headerTitle: 'AI Chatbot',
      headerSubtitle: 'Email Verification',
      greeting: 'Hello',
      message: 'Thank you for signing up! To complete your registration and start using our AI-powered chatbot, please verify your email address by clicking the button below.',
      button: 'Verify Email Address',
      linkText: 'Or copy and paste this link into your browser:',
      footer: 'If you did not create an account with us, you can safely ignore this email.',
      footerNote: 'This verification link will expire in 24 hours.',
    },
    ar: {
      subject: 'تحقق من بريدك الإلكتروني - الشات بوت الذكي',
      headerTitle: 'الشات بوت الذكي',
      headerSubtitle: 'التحقق من البريد الإلكتروني',
      greeting: 'مرحباً',
      message: 'شكراً لتسجيلك! لإكمال تسجيلك وبدء استخدام الشات بوت المدعوم بالذكاء الاصطناعي، يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه.',
      button: 'تحقق من البريد الإلكتروني',
      linkText: 'أو انسخ والصق هذا الرابط في متصفحك:',
      footer: 'إذا لم تقم بإنشاء حساب معنا، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
      footerNote: 'سينتهي صلاحية رابط التحقق هذا خلال 24 ساعة.',
    },
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const content = `
    <div class="header">
      <h1>${t.headerTitle}</h1>
      <p>${t.headerSubtitle}</p>
    </div>
    <div class="content">
      <p class="greeting">${t.greeting},</p>
      <p class="message">${t.message}</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button">${t.button}</a>
      </div>
      
      <div class="link-section">
        <p>${t.linkText}</p>
        <a href="${verificationUrl}" class="link">${verificationUrl}</a>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p style="margin-top: 12px; font-weight: 500;">${t.footerNote}</p>
      <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} AI Chatbot. All rights reserved.</p>
    </div>
  `;

  const mailOptions = {
    to: email,
    subject: t.subject,
    html: getEmailTemplate(content, isRTL, language),
    text: `${t.greeting}\n\n${t.message}\n\n${verificationUrl}\n\n${t.footer}\n${t.footerNote}`,
  };

  return await sendEmail(mailOptions);
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, token, language = 'en') => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

  const translations = {
    en: {
      subject: 'Reset Your Password - AI Chatbot',
      headerTitle: 'AI Chatbot',
      headerSubtitle: 'Password Reset Request',
      greeting: 'Hello',
      message: 'We received a request to reset the password for your account. Click the button below to create a new password:',
      button: 'Reset Password',
      linkText: 'Or copy and paste this link into your browser:',
      warning: 'This password reset link will expire in 1 hour for security reasons.',
      footer: 'If you did not request a password reset, please ignore this email and your password will remain unchanged. For security, you may want to change your password if you suspect unauthorized access.',
    },
    ar: {
      subject: 'إعادة تعيين كلمة المرور - الشات بوت الذكي',
      headerTitle: 'الشات بوت الذكي',
      headerSubtitle: 'طلب إعادة تعيين كلمة المرور',
      greeting: 'مرحباً',
      message: 'تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:',
      button: 'إعادة تعيين كلمة المرور',
      linkText: 'أو انسخ والصق هذا الرابط في متصفحك:',
      warning: 'سينتهي صلاحية رابط إعادة تعيين كلمة المرور هذا خلال ساعة واحدة لأسباب أمنية.',
      footer: 'إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني وستظل كلمة المرور الخاصة بك دون تغيير. لمزيد من الأمان، قد ترغب في تغيير كلمة المرور الخاصة بك إذا كنت تشك في وجود وصول غير مصرح به.',
    },
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const content = `
    <div class="header">
      <h1>${t.headerTitle}</h1>
      <p>${t.headerSubtitle}</p>
    </div>
    <div class="content">
      <p class="greeting">${t.greeting},</p>
      <p class="message">${t.message}</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">${t.button}</a>
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ ${t.warning}</strong></p>
      </div>
      
      <div class="link-section">
        <p>${t.linkText}</p>
        <a href="${resetUrl}" class="link">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} AI Chatbot. All rights reserved.</p>
    </div>
  `;

  const mailOptions = {
    to: email,
    subject: t.subject,
    html: getEmailTemplate(content, isRTL, language),
    text: `${t.greeting}\n\n${t.message}\n\n${resetUrl}\n\n${t.warning}\n\n${t.footer}`,
  };

  return await sendEmail(mailOptions);
};

/**
 * Envoyer un email de bienvenue
 */
const sendWelcomeEmail = async (email, username, language = 'en') => {
  const translations = {
    en: {
      subject: 'Welcome to AI Chatbot!',
      headerTitle: 'Welcome Aboard!',
      headerSubtitle: `Hello ${username}`,
      greeting: `Hi ${username}`,
      message: 'Thank you for joining AI Chatbot! We are excited to have you as part of our community. Our AI-powered platform is ready to assist you with intelligent conversations.',
      featuresTitle: 'What you can do with AI Chatbot:',
      feature1: 'Chat with multiple advanced AI models',
      feature2: 'Save and review your entire chat history',
      feature3: 'Full support for English and Arabic languages',
      feature4: 'Access from any device, anywhere',
      button: 'Start Chatting Now',
      footer: 'If you have any questions or need assistance, feel free to reach out to our support team at support@aichat.com',
      tips: 'Pro tip: Try exploring different AI models to find the one that best suits your needs!',
    },
    ar: {
      subject: 'مرحباً بك في الشات بوت الذكي!',
      headerTitle: 'مرحباً بك!',
      headerSubtitle: `أهلاً ${username}`,
      greeting: `مرحباً ${username}`,
      message: 'شكراً لانضمامك إلى الشات بوت الذكي! نحن متحمسون لوجودك كجزء من مجتمعنا. منصتنا المدعومة بالذكاء الاصطناعي جاهزة لمساعدتك بمحادثات ذكية.',
      featuresTitle: 'ما يمكنك القيام به مع الشات بوت الذكي:',
      feature1: 'تحدث مع نماذج ذكاء اصطناعي متقدمة متعددة',
      feature2: 'احفظ وراجع سجل محادثاتك بالكامل',
      feature3: 'دعم كامل للغتين الإنجليزية والعربية',
      feature4: 'الوصول من أي جهاز، في أي مكان',
      button: 'ابدأ المحادثة الآن',
      footer: 'إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، لا تتردد في التواصل مع فريق الدعم لدينا على support@aichat.com',
      tips: 'نصيحة احترافية: جرب استكشاف نماذج الذكاء الاصطناعي المختلفة للعثور على النموذج الذي يناسب احتياجاتك بشكل أفضل!',
    },
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  const chatUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat`;

  const content = `
    <div class="header">
      <h1>${t.headerTitle}</h1>
      <p>${t.headerSubtitle}</p>
    </div>
    <div class="content">
      <p class="greeting">${t.greeting},</p>
      <p class="message">${t.message}</p>
      
      <div class="features">
        <p class="features-title">${t.featuresTitle}</p>
        <div class="feature-item">✓ ${t.feature1}</div>
        <div class="feature-item">✓ ${t.feature2}</div>
        <div class="feature-item">✓ ${t.feature3}</div>
        <div class="feature-item">✓ ${t.feature4}</div>
      </div>
      
      <div class="button-container">
        <a href="${chatUrl}" class="button">${t.button}</a>
      </div>
      
      <div class="link-section">
        <p style="color: #3b82f6; font-weight: 500;">💡 ${t.tips}</p>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <div class="footer-links">
        <a href="${process.env.FRONTEND_URL}/help">Help Center</a>
        <a href="${process.env.FRONTEND_URL}/privacy">Privacy Policy</a>
        <a href="${process.env.FRONTEND_URL}/terms">Terms of Service</a>
      </div>
      <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} AI Chatbot. All rights reserved.</p>
    </div>
  `;

  const mailOptions = {
    to: email,
    subject: t.subject,
    html: getEmailTemplate(content, isRTL, language),
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};