// FieldSync v2 - Equipment Type Constants

export const EQUIPMENT_TYPES = {
  'center': 'Center Pivot',
  'linear': 'Linear Pivot',
  'corner': 'Corner System',
  'power_unit': 'Power Unit',
  'generator': 'Generator',
  'pump': 'Pump',
  'well': 'Well',
  'motor': 'Motor',
  'panel': 'Control Panel',
  'other': 'Other'
};

/** @param {string} type */
export const formatEquipmentType = (type) => EQUIPMENT_TYPES[type] || type || 'Unknown';
