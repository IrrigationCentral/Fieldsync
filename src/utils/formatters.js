// FieldSync v2 - Formatting Utilities

/** @param {Object|Date|string|null} dateString */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** @param {Object|Date|string|null} dateString */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** @param {number} amount */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

/** @param {Date} date */
export const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/** @param {string} phone */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  if (cleaned.length === 11) return `(${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
  return phone;
};
