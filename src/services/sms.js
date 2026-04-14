// ============================================
// SMS NOTIFICATION SERVICE (via Twilio)
// Sends real SMS through Vercel API → Twilio
// No carrier selection needed — direct to phone number
// ============================================

// Legacy carrier list kept for backward compatibility with existing user profiles
// New users don't need to select a carrier — Twilio sends directly
export const CARRIERS = {
  att: { name: 'AT&T' },
  verizon: { name: 'Verizon' },
  tmobile: { name: 'T-Mobile' },
  sprint: { name: 'Sprint/T-Mobile' },
  uscellular: { name: 'US Cellular' },
  boost: { name: 'Boost Mobile' },
  cricket: { name: 'Cricket' },
  metropcs: { name: 'Metro by T-Mobile' },
  googlefi: { name: 'Google Fi' },
  republic: { name: 'Republic Wireless' },
  straight: { name: 'Straight Talk' },
  tracfone: { name: 'TracFone' },
  consumer: { name: 'Consumer Cellular' },
  xfinity: { name: 'Xfinity Mobile' },
  visible: { name: 'Visible' }
};

// Format phone number to 10 digits
const formatPhone = (phone) => {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.substring(1);
  return digits;
};

// Legacy compatibility — no longer needed for Twilio but kept for existing code references
export const getSmsEmail = (phone, carrier) => {
  return formatPhone(phone) || null;
};

// Check if Twilio is configured (always true — config is server-side)
export const isEmailJSConfigured = () => true;

// ============================================
// TWILIO SMS via Vercel API Route
// ============================================
const sendViaTwilio = async (phone, subject, message) => {
  const cleanPhone = formatPhone(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    console.error('Invalid phone number:', phone, '→', cleanPhone);
    return { success: false, error: `Invalid phone number: "${phone}" — need 10 digits` };
  }

  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: cleanPhone, subject, message })
    });

    const data = await response.json();
    if (data.success) {
      console.log('SMS sent via Twilio:', cleanPhone, 'SID:', data.sid);
      return { success: true, sid: data.sid };
    } else {
      console.error('Twilio API error:', data.error);
      return { success: false, error: data.error || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message || 'Network error sending SMS' };
  }
};

// Send SMS notification — signature kept compatible with old EmailJS version
// "carrier" parameter is now ignored (Twilio doesn't need it)
export const sendSmsNotification = async (phone, carrier, subject, message) => {
  console.log('Sending SMS via Twilio:', { phone, subject });
  return sendViaTwilio(phone, subject, message);
};

// Send email notification — placeholder until SendGrid or similar is added
export const sendEmailNotification = async (email, subject, message) => {
  console.log('Email notification (not yet configured for Twilio):', { email, subject });
  // TODO: Add SendGrid or Twilio email integration
  return { success: false, error: 'Email notifications not yet configured — SMS only' };
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================
export const notifyNewJob = async (user, job) => {
  const message = `New job - ${job.title}. ${job.pivotName || ''}. Priority: ${job.priority}`;
  if (user.phone) return sendViaTwilio(user.phone, 'FieldSync - New Job', message);
  return { success: false, error: 'No phone number' };
};

export const notifyJobAssigned = async (tech, job) => {
  const message = `Job assigned - ${job.title}. Location: ${job.pivotName || 'TBD'}. Check app for details.`;
  if (tech.phone) return sendViaTwilio(tech.phone, 'FieldSync', message);
  return { success: false, error: 'No phone number' };
};

export const notifyJobCompleted = async (farmer, job) => {
  const message = `Service complete - ${job.pivotName || job.title}. Your equipment has been serviced. Thank you for choosing Irrigation Central!`;
  if (farmer.phone) return sendViaTwilio(farmer.phone, 'FieldSync', message);
  return { success: false, error: 'No phone number' };
};

// Test notification
export const sendTestNotification = async (user) => {
  const message = 'This is a test from FieldSync! If you got this, SMS is working.';
  if (user.phone) {
    return sendViaTwilio(user.phone, 'FieldSync Test', message);
  }
  return { success: false, error: 'No phone number set' };
};

// ============================================
// STAFF NOTIFICATIONS
// ============================================
const notifyUser = async (user, subject, message) => {
  if (!user) return { success: false, error: 'No user provided' };
  if (user.phone) return sendViaTwilio(user.phone, subject, message);
  return { success: false, error: 'No phone number' };
};

export const notifyManagersNewIssue = async (managers, job, reportedBy) => {
  const results = [];
  const message = `New issue - ${job.title || job.pivotName}. Priority: ${job.priority}. ${reportedBy ? `Reported by: ${reportedBy}` : ''}`;
  for (const manager of managers) {
    const result = await notifyUser(manager, 'FieldSync', message);
    results.push({ userId: manager.id, ...result });
  }
  return results;
};

export const notifyOfficeNewIssue = async (officeStaff, job, reportedBy) => {
  const results = [];
  const message = `New issue - ${job.title || job.pivotName}. Priority: ${job.priority}. ${reportedBy ? `Reported by: ${reportedBy}` : ''}`;
  for (const staff of officeStaff) {
    const result = await notifyUser(staff, 'FieldSync', message);
    results.push({ userId: staff.id, ...result });
  }
  return results;
};

export const notifyManagersJobCompleted = async (managers, job, completedBy) => {
  const results = [];
  const message = `Job completed - ${job.title || job.pivotName}. ${completedBy ? `By: ${completedBy}` : ''}`;
  for (const manager of managers) {
    const result = await notifyUser(manager, 'FieldSync', message);
    results.push({ userId: manager.id, ...result });
  }
  return results;
};

export const notifyOfficeJobCompleted = async (officeStaff, job, completedBy) => {
  const results = [];
  const message = `Job completed - ${job.title || job.pivotName}. ${completedBy ? `By: ${completedBy}` : ''}`;
  for (const staff of officeStaff) {
    const result = await notifyUser(staff, 'FieldSync', message);
    results.push({ userId: staff.id, ...result });
  }
  return results;
};
