// FieldSync v2 - Map Page
// Extracted from App.js MapView (~line 3161)
import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { useEquipment } from '../../hooks/useEquipment';
import { formatEquipmentType } from '../../constants/equipmentTypes';
import { Button, Badge, Spinner } from '../../components/ui';

const MapPage = () => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { equipment, jobs } = useData();
  const { addNotification } = useNotifications();
  const { updateLocation } = useEquipment();

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [editingPivot, setEditingPivot] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');

  // Filter pivots based on role
  const visibleEquipment = userProfile?.role === 'farmer'
    ? equipment.filter(p => p.farmerId === userProfile?.id)
    : equipment;

  // Default center (Sikeston, MO area)
  const defaultCenter = { lat: 36.88, lng: -89.59 };

  // Get user's current location
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      addNotification('error', 'Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (googleMapRef.current) {
          googleMapRef.current.panTo(pos);
          googleMapRef.current.setZoom(14);
        }
        addNotification('success', 'Moved to your location');
      },
      () => {
        addNotification('error', 'Unable to get your location. Please check permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Initialize map
  useEffect(() => {
    if (!window.google || !mapRef.current || googleMapRef.current) return;

    let center = defaultCenter;
    const equipmentWithLocation = visibleEquipment.filter(p => p.lat && p.lng);
    if (equipmentWithLocation.length > 0) {
      const avgLat = equipmentWithLocation.reduce((sum, p) => sum + p.lat, 0) / equipmentWithLocation.length;
      const avgLng = equipmentWithLocation.reduce((sum, p) => sum + p.lng, 0) / equipmentWithLocation.length;
      center = { lat: avgLat, lng: avgLng };
    }

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: window.google.maps.ControlPosition.TOP_RIGHT
      },
      fullscreenControl: true,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
      scaleControl: true,
      rotateControl: false,
      gestureHandling: 'greedy',
      scrollwheel: true
    });

    setMapLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when pivots change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each pivot
    visibleEquipment.forEach(pivot => {
      if (!pivot.lat || !pivot.lng) return;

      const isNeedsService = pivot.status === 'needs-service';
      const hasActiveJob = jobs.some(j => j.pivotId === pivot.id && ['pending', 'assigned', 'in-progress', 'needs-followup'].includes(j.status));

      const marker = new window.google.maps.Marker({
        position: { lat: pivot.lat, lng: pivot.lng },
        map: googleMapRef.current,
        title: pivot.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: hasActiveJob ? '#FAAD14' : isNeedsService ? '#C73E1D' : '#52C41A',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        }
      });

      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`;
      const infoContent = `
        <div style="padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #2D5016; font-weight: bold;">${pivot.name}</h3>
          <p style="margin: 4px 0; color: #5C6650;">${formatEquipmentType(pivot.type)} \u2022 ${pivot.acres} acres</p>
          ${pivot.address ? `<p style="margin: 4px 0; color: #9CA986; font-size: 12px;">${pivot.address}</p>` : ''}
          <p style="margin: 8px 0 0 0;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${isNeedsService ? '#C73E1D20' : '#52C41A20'}; color: ${isNeedsService ? '#C73E1D' : '#52C41A'};">
              ${pivot.status}
            </span>
          </p>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2D5016; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
            Get Directions
          </a>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have multiple pivots
    if (visibleEquipment.filter(p => p.lat && p.lng).length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      visibleEquipment.forEach(p => {
        if (p.lat && p.lng) bounds.extend({ lat: p.lat, lng: p.lng });
      });
      googleMapRef.current.fitBounds(bounds, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEquipment, jobs, mapLoaded]);

  // Search for address
  const handleAddressSearch = () => {
    if (!window.google || !searchAddress || !editingPivot) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = results[0].formatted_address;

        updateLocation(editingPivot.id, lat, lng, address);
        setSearchAddress('');
        setEditingPivot(null);

        googleMapRef.current.panTo({ lat, lng });
        googleMapRef.current.setZoom(14);
      } else {
        addNotification('error', 'Address not found. Try a different search.');
      }
    });
  };

  // Click on map to set location
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded || !editingPivot) return;

    const clickListener = googleMapRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const address = status === 'OK' && results[0] ? results[0].formatted_address : '';
        updateLocation(editingPivot.id, lat, lng, address);
        setEditingPivot(null);
      });
    });

    return () => window.google.maps.event.removeListener(clickListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPivot, mapLoaded]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
          {userProfile?.role === 'farmer' ? 'My Equipment Map' : 'Field Map'}
        </h2>
        <div className="flex items-center space-x-2">
          <Badge variant="success">{visibleEquipment.filter(p => p.status === 'active').length} Active</Badge>
          <Badge variant="warning">{jobs.filter(j => ['pending', 'assigned', 'in-progress', 'needs-followup'].includes(j.status)).length} Jobs</Badge>
          <Badge variant="danger">{visibleEquipment.filter(p => p.status === 'needs-service').length} Need Service</Badge>
        </div>
      </div>

      {/* Editing Mode Banner */}
      {editingPivot && (
        <div className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.accent + '20', border: `2px solid ${colors.accent}` }}>
          <div>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>Setting location for: {editingPivot.name}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Click on the map or search for an address below</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditingPivot(null)}>Cancel</Button>
        </div>
      )}

      {/* Address Search */}
      {editingPivot && (
        <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search address (e.g., 123 Farm Road, Nebraska)"
              className="input flex-1"
              value={searchAddress}
              onChange={e => setSearchAddress(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddressSearch()}
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
            />
            <Button icon={Search} onClick={handleAddressSearch}>Search</Button>
          </div>
        </div>
      )}

      {/* Google Map */}
      <div className="card overflow-hidden" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        {/* Map Controls */}
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="secondary" icon={Navigation} onClick={handleMyLocation}>My Location</Button>
            <Button size="sm" variant="secondary" onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 12) + 1)}>Zoom +</Button>
            <Button size="sm" variant="secondary" onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 12) - 1)}>Zoom -</Button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background, color: colors.textSecondary }} onClick={() => googleMapRef.current?.setMapTypeId('hybrid')}>Satellite</button>
            <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background, color: colors.textSecondary }} onClick={() => googleMapRef.current?.setMapTypeId('roadmap')}>Map</button>
            <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background, color: colors.textSecondary }} onClick={() => googleMapRef.current?.setMapTypeId('terrain')}>Terrain</button>
          </div>
        </div>
        <div ref={mapRef} style={{ height: '500px', width: '100%' }}>
          {!window.google && (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-2" style={{ color: colors.textSecondary }}>Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 p-4 border-t" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm" style={{ color: colors.textSecondary }}>Active Pivot</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm" style={{ color: colors.textSecondary }}>Needs Service</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-sm" style={{ color: colors.textSecondary }}>Active Job</span>
          </div>
        </div>
      </div>

      {/* Pivot List with Location Edit */}
      <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Equipment Locations</h3>
        {visibleEquipment.length === 0 ? (
          <p className="text-center py-4" style={{ color: colors.textSecondary }}>No Equipment to display</p>
        ) : (
          <div className="space-y-2">
            {visibleEquipment.map(pivot => (
              <div key={pivot.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${pivot.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{pivot.name}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{pivot.address || 'No address set'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{pivot.acres} acres</p>
                    {pivot.lat && pivot.lng && (
                      <p className="text-xs" style={{ color: colors.muted }}>{pivot.lat.toFixed(4)}, {pivot.lng.toFixed(4)}</p>
                    )}
                  </div>
                  {(userProfile?.role === 'farmer' && pivot.farmerId === userProfile?.id) || ['manager', 'tech', 'office'].includes(userProfile?.role) ? (
                    <Button size="sm" variant={editingPivot?.id === pivot.id ? 'primary' : 'secondary'} icon={MapPin} onClick={() => setEditingPivot(editingPivot?.id === pivot.id ? null : pivot)}>
                      {pivot.lat && pivot.lng ? 'Edit' : 'Set Location'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
