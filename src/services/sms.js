// ============================================
// SMS NOTIFICATION SERVICE (via Email-to-SMS Gateway)
// ============================================
import emailjs from '@emailjs/browser';

// Carrier Email-to-SMS Gateways (Updated 2024)
export const CARRIERS = {
  att: { name: 'AT&T', gateway: 'txt.att.net' },
  verizon: { name: 'Verizon', gateway: 'vtext.com' },
  tmobile: { name: 'T-Mobile', gateway: 'tmomail.net' },
  sprint: { name: 'Sprint/T-Mobile', gateway: 'messaging.sprintpcs.com' },
  uscellular: { name: 'US Cellular', gateway: 'email.uscc.net' },
  boost: { name: 'Boost Mobile', gateway: 'sms.myboostmobile.com' },
  cricket: { name: 'Cricket', gateway: 'sms.cricketwireless.net' },
  metropcs: { name: 'Metro by T-Mobile', gateway: 'mymetropcs.com' },
  googlefi: { name: 'Google Fi', gateway: 'msg.fi.google.com' },
  republic: { name: 'Republic Wireless', gateway: 'text.republicwireless.com' },
  straight: { name: 'Straight Talk', gateway: 'vtext.com' },
  tracfone: { name: 'TracFone', gateway: 'mmst5.tracfone.com' },
  consumer: { name: 'Consumer Cellular', gateway: 'mailmymobile.net' },
  xfinity: { name: 'Xfinity Mobile', gateway: 'vtext.com' },
  visible: { name: 'Visible', gateway: 'vtext.com' }
};

// Format phone number - extract exactly 10 digits
const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 1 and has 11 digits, remove the leading 1 (US country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.substring(1);
  }
  
  console.log('Phone formatting:', { original: phone, cleaned: digits, length: digits.length });
  return digits;
};

// Get SMS email address from phone + carrier
export const getSmsEmail = (phone, carrier) => {
  const cleanPhone = formatPhone(phone);
  const carrierInfo = CARRIERS[carrier];
  
  if (!carrierInfo) {
    console.error('Unknown carrier:', carrier);
    return null;
  }
  
  if (cleanPhone.length !== 10) {
    console.error('Invalid phone number length:', cleanPhone.length, '(expected 10)');
    return null;
  }
  
  const email = `${cleanPhone}@${carrierInfo.gateway}`;
  console.log('Generated SMS email:', email);
  return email;
};

// ============================================
// EmailJS Configuration
// ============================================
// IMPORTANT: You need to set up EmailJS properly:
// 1. Go to https://www.emailjs.com/ and create account
// 2. Connect your email service (Gmail recommended)
// 3. Create an email template with these variables:
//    - {{to_email}} - recipient email address
//    - {{subject}} - email subject
//    - {{message}} - message body
// 4. Copy your Service ID, Template ID, and Public Key below
// ============================================
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || '',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || ''
};

// Check if EmailJS is configured
export const isEmailJSConfigured = () => {
  const configured = !!(
    process.env.REACT_APP_EMAILJS_SERVICE_ID &&
    process.env.REACT_APP_EMAILJS_TEMPLATE_ID &&
    process.env.REACT_APP_EMAILJS_PUBLIC_KEY
  );
  console.log('EmailJS configured:', configured);
  return configured;
};

// Send SMS notification via EmailJS
export const sendSmsNotification = async (phone, carrier, subject, message) => {
  console.log('Attempting to send SMS:', { phone, carrier, subject });

  if (!isEmailJSConfigured()) {
    console.warn('EmailJS not configured. Missing environment variables.');
    console.log('Would send to:', getSmsEmail(phone, carrier));
    console.log('Message:', message);
    return { success: false, error: 'EmailJS not configured - check environment variables' };
  }

  const toEmail = getSmsEmail(phone, carrier);
  if (!toEmail) {
    console.error('Invalid carrier or missing carrier:', carrier);
    return { success: false, error: 'Invalid carrier - user needs to set carrier in profile' };
  }

  try {
    console.log('Sending via EmailJS to:', toEmail);
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email: toEmail,
        subject: subject,
        message: message
      },
      EMAILJS_CONFIG.publicKey
    );
    console.log('EmailJS response:', response);
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error?.text || error?.message || 'Failed to send' };
  }
};

// Send direct email notification (for customers with email but no phone)
export const sendEmailNotification = async (email, subject, message) => {
  console.log('Attempting to send email:', { email, subject });
  
  if (!isEmailJSConfigured()) {
    console.warn('EmailJS not properly configured.');
    return { success: false, error: 'EmailJS not configured' };
  }

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email: email,
        subject: subject,
        message: message
      },
      EMAILJS_CONFIG.publicKey
    );
    console.log('Email sent:', response);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error?.text || error?.message || 'Failed to send' };
  }
};

// Notification Templates with SMS + Email fallback
export const notifyNewJob = async (user, job) => {
  const message = `FieldSync: New job - ${job.title}. ${job.pivotName || ''}. Priority: ${job.priority}`;
  
  // If user prefers email only, skip SMS
  if (user.carrier === 'email_only' && user.email) {
    return sendEmailNotification(user.email, 'FieldSync - New Job', message);
  }
  
  // Try SMS first if phone and carrier are set
  if (user.phone && user.carrier && user.carrier !== 'email_only') {
    const smsResult = await sendSmsNotification(user.phone, user.carrier, 'New Job', message);
    if (smsResult.success) return smsResult;
  }
  
  // Fallback to email
  if (user.email) {
    return sendEmailNotification(user.email, 'FieldSync - New Job', message);
  }
  
  return { success: false, error: 'No contact method available' };
};

export const notifyJobAssigned = async (tech, job) => {
  const message = `FieldSync: Job assigned - ${job.title}. Location: ${job.pivotName || 'TBD'}. Check app for details.`;
  
  // If user prefers email only, skip SMS
  if (tech.carrier === 'email_only' && tech.email) {
    return sendEmailNotification(tech.email, 'FieldSync - Job Assigned', message);
  }
  
  // Try SMS first if phone and carrier are set
  if (tech.phone && tech.carrier && tech.carrier !== 'email_only') {
    const smsResult = await sendSmsNotification(tech.phone, tech.carrier, 'Job Assigned', message);
    if (smsResult.success) return smsResult;
  }
  
  // Fallback to email
  if (tech.email) {
    return sendEmailNotification(tech.email, 'FieldSync - Job Assigned', message);
  }
  
  return { success: false, error: 'No contact method available' };
};

export const notifyJobCompleted = async (farmer, job) => {
  const message = `FieldSync: Service complete - ${job.title}. Your pivot ${job.pivotName || ''} has been serviced. Thank you for choosing Irrigation Central!`;
  
  // If user prefers email only, skip SMS
  if (farmer.carrier === 'email_only' && farmer.email) {
    return sendEmailNotification(farmer.email, 'FieldSync - Service Complete', message);
  }
  
  // Try SMS first if phone and carrier are set
  if (farmer.phone && farmer.carrier && farmer.carrier !== 'email_only') {
    const smsResult = await sendSmsNotification(farmer.phone, farmer.carrier, 'Job Complete', message);
    if (smsResult.success) return smsResult;
  }
  
  // Fallback to email
  if (farmer.email) {
    return sendEmailNotification(farmer.email, 'FieldSync - Service Complete', message);
  }
  
  return { success: false, error: 'No contact method available' };
};

// Test notification (useful for debugging)
export const sendTestNotification = async (user) => {
  const message = 'This is a test notification from FieldSync! If you received this, SMS is working.';
  
  if (user.phone && user.carrier) {
    const smsEmail = getSmsEmail(user.phone, user.carrier);
    console.log('Test SMS - Phone:', user.phone, 'Carrier:', user.carrier, 'Email:', smsEmail);
    
    if (!smsEmail) {
      return { 
        success: false, 
        error: `Invalid phone format. Got "${user.phone}" - need 10 digits.`,
        debug: { phone: user.phone, carrier: user.carrier }
      };
    }
    
    const result = await sendSmsNotification(user.phone, user.carrier, 'FieldSync Test', message);
    return { ...result, smsEmail, debug: { phone: user.phone, carrier: user.carrier } };
  }
  
  if (user.email) {
    return sendEmailNotification(user.email, 'FieldSync Test', message);
  }
  
  return { success: false, error: 'No contact method (need phone+carrier or email)' };
};

// ============================================
// STAFF NOTIFICATIONS
// ============================================

// Generic notify user function
const notifyUser = async (user, subject, message) => {
  if (!user) return { success: false, error: 'No user provided' };
  
  // Try SMS first
  if (user.phone && user.carrier) {
    const smsResult = await sendSmsNotification(user.phone, user.carrier, subject, message);
    if (smsResult.success) return smsResult;
  }
  
  // Fallback to email
  if (user.email) {
    return sendEmailNotification(user.email, `FieldSync - ${subject}`, message);
  }
  
  return { success: false, error: 'No contact method available' };
};

// Notify all managers about new issue
export const notifyManagersNewIssue = async (managers, job, reportedBy) => {
  const results = [];
  const message = `FieldSync: New issue reported - ${job.title || job.pivotName}. Priority: ${job.priority}. ${reportedBy ? `Reported by: ${reportedBy}` : ''}`;
  
  for (const manager of managers) {
    const result = await notifyUser(manager, 'New Issue', message);
    results.push({ userId: manager.id, ...result });
  }
  
  console.log('Manager notifications sent:', results);
  return results;
};

// Notify all office staff about new issue
export const notifyOfficeNewIssue = async (officeStaff, job, reportedBy) => {
  const results = [];
  const message = `FieldSync: New issue reported - ${job.title || job.pivotName}. Priority: ${job.priority}. ${reportedBy ? `Reported by: ${reportedBy}` : ''}`;
  
  for (const staff of officeStaff) {
    const result = await notifyUser(staff, 'New Issue', message);
    results.push({ userId: staff.id, ...result });
  }
  
  console.log('Office notifications sent:', results);
  return results;
};

// Notify managers about job completion
export const notifyManagersJobCompleted = async (managers, job, completedBy) => {
  const results = [];
  const message = `FieldSync: Job completed - ${job.title || job.pivotName}. ${completedBy ? `Completed by: ${completedBy}` : ''}`;
  
  for (const manager of managers) {
    const result = await notifyUser(manager, 'Job Completed', message);
    results.push({ userId: manager.id, ...result });
  }
  
  console.log('Manager completion notifications sent:', results);
  return results;
};

// Notify office staff about job completion
export const notifyOfficeJobCompleted = async (officeStaff, job, completedBy) => {
  const results = [];
  const message = `FieldSync: Job completed - ${job.title || job.pivotName}. ${completedBy ? `Completed by: ${completedBy}` : ''}`;
  
  for (const staff of officeStaff) {
    const result = await notifyUser(staff, 'Job Completed', message);
    results.push({ userId: staff.id, ...result });
  }
  
  console.log('Office completion notifications sent:', results);
  return results;
};
