import React, { useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { MapPin, Phone, Mail, Navigation } from 'lucide-react'

interface Location {
    id: string
    name: string
    lat: number
    lng: number
    type: 'vet' | 'petstore'
    phone?: string
    email?: string
    address?: string
}

interface VetMapProps {
    locations: Location[]
    center?: { lat: number; lng: number }
    zoom?: number
}

const containerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '12px'
}

const defaultCenter = {
    lat: 30.0444,
    lng: 31.2357 // Cairo, Egypt
}

const VetMap: React.FC<VetMapProps> = ({
    locations,
    center = defaultCenter,
    zoom = 12
}) => {
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    const getMarkerIcon = (type: string) => {
        return type === 'vet'
            ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    }

    const handleGetDirections = (location: Location) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
        window.open(url, '_blank')
    }

    return (
        <div className="w-full">
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={zoom}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {locations.map((location) => (
                        <Marker
                            key={location.id}
                            position={{ lat: location.lat, lng: location.lng }}
                            onClick={() => setSelectedLocation(location)}
                            icon={getMarkerIcon(location.type)}
                            title={location.name}
                        />
                    ))}

                    {selectedLocation && (
                        <InfoWindow
                            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                            onCloseClick={() => setSelectedLocation(null)}
                        >
                            <div className="p-2 max-w-xs">
                                <h3 className="font-bold text-lg mb-2 text-gray-900">{selectedLocation.name}</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4" />
                                        <span>{selectedLocation.address || 'العنوان غير متوفر'}</span>
                                    </div>
                                    {selectedLocation.phone && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${selectedLocation.phone}`} className="hover:text-[var(--color-vet-primary)]">
                                                {selectedLocation.phone}
                                            </a>
                                        </div>
                                    )}
                                    {selectedLocation.email && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${selectedLocation.email}`} className="hover:text-[var(--color-vet-primary)]">
                                                {selectedLocation.email}
                                            </a>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleGetDirections(selectedLocation)}
                                        className="mt-3 w-full flex items-center justify-center gap-2 bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        احصل على الاتجاهات
                                    </button>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>

            {/* Legend */}
            <div className="mt-4 flex gap-6 justify-center text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[var(--color-vet-primary)] rounded-full"></div>
                    <span>عيادات بيطرية</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[var(--color-vet-secondary)] rounded-full"></div>
                    <span>متاجر الحيوانات</span>
                </div>
            </div>
        </div>
    )
}

export default VetMap
