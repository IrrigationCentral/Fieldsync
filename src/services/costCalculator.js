// FieldSync v2 - Cost Calculation Service

/**
 * @param {Object} completionData - {hoursWorked, milesDriven, partsCost}
 * @param {Object} settings - {hourlyRate, mileageRate, partsMarkup}
 * @returns {number}
 */
export const calculateJobCost = (completionData, settings) => {
  const laborCost = (completionData.hoursWorked || 0) * (settings.hourlyRate || 75);
  const mileageCost = (completionData.milesDriven || 0) * (settings.mileageRate || 0.65);
  const partsCost = (completionData.partsCost || 0) * (1 + (settings.partsMarkup || 0) / 100);
  return laborCost + mileageCost + partsCost;
};

/**
 * @param {Object} completionData
 * @param {Object} settings
 * @returns {{ laborCost: number, mileageCost: number, partsCost: number, totalCost: number }}
 */
export const calculateCostBreakdown = (completionData, settings) => {
  const laborCost = (completionData.hoursWorked || 0) * (settings.hourlyRate || 75);
  const mileageCost = (completionData.milesDriven || 0) * (settings.mileageRate || 0.65);
  const partsCost = (completionData.partsCost || 0) * (1 + (settings.partsMarkup || 0) / 100);
  return { laborCost, mileageCost, partsCost, totalCost: laborCost + mileageCost + partsCost };
};
