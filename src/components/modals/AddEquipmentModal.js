// ============================================
// ADD EQUIPMENT MODAL
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Droplets, Wrench, MapPin, Map, Navigation, ChevronUp, ChevronDown, User } from 'lucide-react';
import { Modal, Button, Input, Select, SearchableSelect } from '../ui';

const AddEquipmentModal = ({
  isOpen,
  onClose,
  onAdd,
  users,
  userProfile,
  isLoading,
  colors,
  addNotification
}) => {
  const farmers = users.filter(u => u.role === 'farmer');
  const isStaff = ['tech', 'manager', 'office'].includes(userProfile?.role);
  
  const [formData, setFormData] = useState({ 
    farmerId: '', name: '', type: 'center', acres: '', brand: '', model: '', serialNumber: '',
    powerType: '', panelType: '', dateInstalled: '', length: '', spans: '',
    nozzles: '', pressure: '', gpm: '', endGun: '', tireSize: '', nozzlePackage: '',
    gearboxRatio: '', driveType: '', lat: '', lng: '', address: '', notes: ''
  });
  const [showMap, setShowMap] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize mini map when shown
  useEffect(() => {
    if (!showMap || !window.google || !mapContainerRef.current || mapInstanceRef.current) return;
    
    const center = formData.lat && formData.lng 
      ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }
      : { lat: 36.88, lng: -89.59 }; // Sikeston, MO
    
    mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 12,
      mapTypeId: 'hybrid',
      gestureHandling: 'greedy'
    });

    // Add click listener to drop pin
    mapInstanceRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          draggable: true,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#2D5016',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        });
        
        // Allow dragging the marker
        markerRef.current.addListener('dragend', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          updateLocationFromCoords(newLat, newLng);
        });
      }
      
      updateLocationFromCoords(lat, lng);
    });

    // If we have existing coordinates, add a marker
    if (formData.lat && formData.lng) {
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#2D5016',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // Cleanup map and reset form on modal close
  useEffect(() => {
    if (!isOpen) {
      mapInstanceRef.current = null;
      markerRef.current = null;
      setShowMap(false);
      setShowAdvanced(false);
      // Reset form when modal closes
      setFormData({ 
        farmerId: '', name: '', type: 'center', acres: '', brand: '', model: '', serialNumber: '',
        powerType: '', panelType: '', dateInstalled: '', length: '', spans: '',
        nozzles: '', pressure: '', gpm: '', endGun: '', tireSize: '', nozzlePackage: '',
        gearboxRatio: '', driveType: '', lat: '', lng: '', address: '', notes: ''
      });
    }
  }, [isOpen]);

  const updateLocationFromCoords = (lat, lng) => {
    setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    
    // Reverse geocode to get address
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
        }
      });
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      addNotification('error', 'Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(15);
        }
        
        // Create/move marker
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        } else if (mapInstanceRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            draggable: true,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#2D5016',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            }
          });
        }
        
        updateLocationFromCoords(lat, lng);
      },
      () => addNotification('error', 'Could not get your location'),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        addNotification('error', 'Equipment name is required');
        return;
      }
      
      // Use selected farmerId for staff, or current user's ID for farmers
      const targetFarmerId = isStaff ? formData.farmerId : userProfile?.id;
      
      // Staff must select a customer
      if (isStaff && !formData.farmerId) {
        addNotification('error', 'Please select a customer');
        return;
      }
      
      // Farmers must have a valid user ID
      if (!isStaff && !userProfile?.id) {
        addNotification('error', 'User profile not found. Please try logging in again.');
        return;
      }
      
      // Call onAdd
      onAdd({
        ...formData,
        farmerId: targetFarmerId,
        acres: parseFloat(formData.acres) || 0,
        nozzles: parseInt(formData.nozzles) || 0,
        pressure: parseFloat(formData.pressure) || 0,
        gpm: parseFloat(formData.gpm) || 0,
        length: parseFloat(formData.length) || null,
        spans: parseInt(formData.spans) || null,
        lat: parseFloat(formData.lat) || null,
        lng: parseFloat(formData.lng) || null
      });
    } catch (err) {
      console.error('AddEquipment submit error:', err);
      addNotification('error', 'Failed to submit: ' + err.message);
    }
  };

  const equipmentTypeOptions = [
    { value: 'center', label: 'Center Pivot' }, 
    { value: 'linear', label: 'Linear Pivot' }, 
    { value: 'corner', label: 'Corner System' },
    { value: 'power_unit', label: 'Power Unit' },
    { value: 'generator', label: 'Generator' },
    { value: 'pump', label: 'Pump' },
    { value: 'well', label: 'Well' },
    { value: 'motor', label: 'Motor' },
    { value: 'panel', label: 'Control Panel' },
    { value: 'other', label: 'Other' }
  ];

  const powerTypeOptions = [
    { value: '', label: 'Select...' },
    { value: 'shore', label: 'Shore Power (Electric)' },
    { value: 'diesel', label: 'Diesel Engine' },
    { value: 'propane', label: 'Propane Engine' },
    { value: 'generator', label: 'Generator' }
  ];

  const driveTypeOptions = [
    { value: '', label: 'Select...' },
    { value: 'electric', label: 'Electric' },
    { value: 'hydraulic', label: 'Hydraulic' },
    { value: 'oil', label: 'Oil Drive' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Equipment" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {/* Customer Selection for Staff */}
        {isStaff && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.water + '15', border: `1px solid ${colors.water}` }}>
            <h4 className="font-medium mb-3 flex items-center" style={{ color: colors.textPrimary }}>
              <User className="w-4 h-4 mr-2" style={{ color: colors.water }} />
              Select Customer *
            </h4>
            <SearchableSelect 
              label="Customer Account" 
              value={formData.farmerId} 
              onChange={e => setFormData({...formData, farmerId: e.target.value})} 
              options={[
                { value: '', label: 'Select a customer...' },
                ...farmers.map(f => ({ value: f.id, label: `${f.name}${f.company ? ` (${f.company})` : ''}` }))
              ]}
              placeholder="Search customers..."
              colors={colors}
            />
            {farmers.length === 0 && (
              <p className="text-sm mt-2" style={{ color: colors.warning }}>
                No customers found. Add a customer first.
              </p>
            )}
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h4 className="font-medium mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <Droplets className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
            Basic Information
          </h4>
          <Input 
            label="Equipment Name *" 
            placeholder="North Field Pivot" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Select 
              label="Equipment Type" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})} 
              options={equipmentTypeOptions} 
            />
            <Input 
              label="Acres" 
              type="number" 
              placeholder="125" 
              value={formData.acres} 
              onChange={e => setFormData({...formData, acres: e.target.value})} 
            />
          </div>
        </div>

        {/* Equipment Details Toggle */}
        <div className="border-t pt-4" style={{ borderColor: colors.border }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-3 rounded-lg transition-colors"
            style={{ backgroundColor: colors.background }}
          >
            <span className="font-medium flex items-center" style={{ color: colors.textPrimary }}>
              <Wrench className="w-4 h-4 mr-2" style={{ color: colors.water }} />
              Equipment Details (Optional)
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              {/* Brand & Model */}
              <div className="grid grid-cols-3 gap-3">
                <Input 
                  label="Brand" 
                  placeholder="Valley, Reinke, Zimmatic..." 
                  value={formData.brand} 
                  onChange={e => setFormData({...formData, brand: e.target.value})} 
                />
                <Input 
                  label="Model" 
                  placeholder="8000 Series" 
                  value={formData.model} 
                  onChange={e => setFormData({...formData, model: e.target.value})} 
                />
                <Input 
                  label="Serial Number" 
                  placeholder="VLY-12345" 
                  value={formData.serialNumber} 
                  onChange={e => setFormData({...formData, serialNumber: e.target.value})} 
                />
              </div>

              {/* Power & Panel */}
              <div className="grid grid-cols-3 gap-3">
                <Select 
                  label="Power Type" 
                  value={formData.powerType} 
                  onChange={e => setFormData({...formData, powerType: e.target.value})} 
                  options={powerTypeOptions} 
                />
                <Input 
                  label="Control Panel" 
                  placeholder="Pro2, GPS, Touch Screen" 
                  value={formData.panelType} 
                  onChange={e => setFormData({...formData, panelType: e.target.value})} 
                />
                <Input 
                  label="Date Installed" 
                  type="date" 
                  value={formData.dateInstalled} 
                  onChange={e => setFormData({...formData, dateInstalled: e.target.value})} 
                />
              </div>

              {/* Physical Specs */}
              <div className="grid grid-cols-4 gap-3">
                <Input 
                  label="Length (ft)" 
                  type="number" 
                  placeholder="1320" 
                  value={formData.length} 
                  onChange={e => setFormData({...formData, length: e.target.value})} 
                />
                <Input 
                  label="# of Spans" 
                  type="number" 
                  placeholder="7" 
                  value={formData.spans} 
                  onChange={e => setFormData({...formData, spans: e.target.value})} 
                />
                <Input 
                  label="# of Nozzles" 
                  type="number" 
                  placeholder="250" 
                  value={formData.nozzles} 
                  onChange={e => setFormData({...formData, nozzles: e.target.value})} 
                />
                <Input 
                  label="GPM" 
                  type="number" 
                  placeholder="800" 
                  value={formData.gpm} 
                  onChange={e => setFormData({...formData, gpm: e.target.value})} 
                />
              </div>

              {/* Operating Specs */}
              <div className="grid grid-cols-4 gap-3">
                <Input 
                  label="Pressure (PSI)" 
                  type="number" 
                  placeholder="35" 
                  value={formData.pressure} 
                  onChange={e => setFormData({...formData, pressure: e.target.value})} 
                />
                <Input 
                  label="End Gun" 
                  placeholder="Nelson 150, None" 
                  value={formData.endGun} 
                  onChange={e => setFormData({...formData, endGun: e.target.value})} 
                />
                <Input 
                  label="Tire Size" 
                  placeholder="14.9-24" 
                  value={formData.tireSize} 
                  onChange={e => setFormData({...formData, tireSize: e.target.value})} 
                />
                <Select 
                  label="Drive Type" 
                  value={formData.driveType} 
                  onChange={e => setFormData({...formData, driveType: e.target.value})} 
                  options={driveTypeOptions} 
                />
              </div>

              {/* Additional */}
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Nozzle Package" 
                  placeholder="Senninger LDN" 
                  value={formData.nozzlePackage} 
                  onChange={e => setFormData({...formData, nozzlePackage: e.target.value})} 
                />
                <Input 
                  label="Gearbox Ratio" 
                  placeholder="50:1" 
                  value={formData.gearboxRatio} 
                  onChange={e => setFormData({...formData, gearboxRatio: e.target.value})} 
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Notes</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  placeholder="Any additional notes about this pivot..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Location Section */}
        <div className="border-t pt-4" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center" style={{ color: colors.textPrimary }}>
              <MapPin className="w-4 h-4 mr-2" style={{ color: colors.danger }} />
              Equipment Location
            </h4>
            <Button 
              type="button" 
              size="sm" 
              variant={showMap ? 'primary' : 'secondary'} 
              icon={Map} 
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Hide Map' : 'Drop Pin on Map'}
            </Button>
          </div>
          
          {showMap && (
            <div className="mb-4">
              <div className="flex space-x-2 mb-2">
                <Button type="button" size="sm" variant="secondary" icon={Navigation} onClick={handleMyLocation}>
                  My Location
                </Button>
              </div>
              <div ref={mapContainerRef} style={{ height: '250px', width: '100%', borderRadius: '8px' }} className="border" />
              <p className="text-xs mt-2" style={{ color: colors.muted }}>
                Click on the map to drop a pin, or drag the pin to adjust
              </p>
            </div>
          )}
          
          <Input 
            label="Address" 
            placeholder="123 Farm Road, County, State" 
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Input 
              label="Latitude" 
              type="number" 
              step="any" 
              placeholder="36.8800" 
              value={formData.lat} 
              onChange={e => setFormData({...formData, lat: e.target.value})} 
            />
            <Input 
              label="Longitude" 
              type="number" 
              step="any" 
              placeholder="-89.5900" 
              value={formData.lng} 
              onChange={e => setFormData({...formData, lng: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2" style={{ backgroundColor: colors.cardBg }}>
          <Button type="submit" className="flex-1" icon={Plus} loading={isLoading}>
            Add Equipment
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEquipmentModal;
