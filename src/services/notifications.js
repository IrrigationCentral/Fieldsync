// ============================================
// UNIFIED NOTIFICATION SERVICE
// Sends push notifications via FCM, falls back to SMS/Email
// ============================================
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { sendSmsNotification, sendEmailNotification } from './sms';

// Send push notification via FCM HTTP API
// Note: This requires a server/Cloud Function for production
// For now, we'll use browser notifications + SMS fallback
const sendBrowserNotification = (title, body, data = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: data.tag || 'fieldsync',
        data,
        vibrate: [200, 100, 200]
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return true;
    } catch (error) {
      console.error('Browser notification error:', error);
      return false;
    }
  }
  return false;
};

// Get user's FCM tokens from Firestore
// eslint-disable-next-line no-unused-vars
const getUserTokens = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().fcmTokens || [];
    }
  } catch (error) {
    console.error('Error getting user tokens:', error);
  }
  return [];
};

// Main notification function - tries push, falls back to SMS/Email
export const sendNotification = async (user, title, message, options = {}) => {
  if (!user) return { success: false, error: 'No user provided' };
  
  const results = {
    push: false,
    sms: false,
    email: false
  };

  // 1. Try browser notification (only works if user is currently viewing the app)
  results.push = sendBrowserNotification(title, message, { userId: user.id, ...options });
  
  // 2. Try SMS if user has phone and carrier configured
  if (user.phone && user.carrier && user.carrier !== 'email_only') {
    const smsResult = await sendSmsNotification(user.phone, user.carrier, title, message);
    results.sms = smsResult.success;
  }
  
  // 3. Fallback to email if SMS failed or user prefers email
  if (!results.sms && user.email) {
    const emailResult = await sendEmailNotification(user.email, `FieldSync - ${title}`, message);
    results.email = emailResult.success;
  }

  const success = results.push || results.sms || results.email;
  console.log('Notification results:', { user: user.name, title, results });
  
  return { success, results };
};

// Batch notify multiple users
export const notifyMultiple = async (users, title, message, options = {}) => {
  const results = [];
  for (const user of users) {
    const result = await sendNotification(user, title, message, options);
    results.push({ userId: user.id, userName: user.name, ...result });
  }
  return results;
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const notifications = {
  // New job/issue reported
  newIssue: async (managers, officeStaff, job, reportedBy) => {
    const title = 'New Issue Reported';
    const message = `${job.pivotName || job.title}: ${job.description?.substring(0, 50) || 'New service request'}... Priority: ${job.priority}. Reported by: ${reportedBy}`;
    
    const allStaff = [...managers, ...officeStaff];
    return notifyMultiple(allStaff, title, message, { type: 'new_issue', jobId: job.id });
  },

  // Job assigned to tech
  jobAssigned: async (tech, job) => {
    const title = 'Job Assigned to You';
    const message = `${job.pivotName || job.title}: ${job.description?.substring(0, 50) || 'New assignment'}... Check FieldSync for details.`;
    
    return sendNotification(tech, title, message, { type: 'job_assigned', jobId: job.id });
  },

  // Job completed - notify farmer
  jobCompletedFarmer: async (farmer, job) => {
    const title = 'Service Complete';
    const message = `Your equipment "${job.pivotName}" has been serviced. Thank you for choosing Irrigation Central!`;
    
    return sendNotification(farmer, title, message, { type: 'job_completed', jobId: job.id });
  },

  // Job completed - notify managers/office
  jobCompletedStaff: async (managers, officeStaff, job, completedBy) => {
    const title = 'Job Completed';
    const message = `${job.pivotName || job.title} completed by ${completedBy}.`;
    
    const allStaff = [...managers, ...officeStaff];
    return notifyMultiple(allStaff, title, message, { type: 'job_completed', jobId: job.id });
  },

  // High priority alert
  urgentIssue: async (managers, job, reportedBy) => {
    const title = '🚨 URGENT: High Priority Issue';
    const message = `${job.pivotName || job.title}: ${job.description?.substring(0, 50) || 'Urgent service needed'}... Reported by: ${reportedBy}`;
    
    return notifyMultiple(managers, title, message, { type: 'urgent', jobId: job.id });
  }
};

export default notifications;
