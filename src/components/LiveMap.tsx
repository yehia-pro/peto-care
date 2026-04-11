import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useEffect, useState } from 'react'

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem'
}

const defaultCenter = {
    lat: 30.0444, // Cairo
    lng: 31.2357
}

interface LiveMapProps {
    driverLocation?: { lat: number; lng: number } | null
    pickupLocation?: { lat: number; lng: number } | null
    dropoffLocation?: { lat: number; lng: number } | null
}

export const LiveMap = ({ driverLocation, pickupLocation, dropoffLocation }: LiveMapProps) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
    })

    const [map, setMap] = useState<google.maps.Map | null>(null)

    useEffect(() => {
        if (map && driverLocation) {
            map.panTo(driverLocation)
        }
    }, [map, driverLocation])

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl">
                Map cannot be loaded. Please check API Key.
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl">
                Loading Map...
            </div>
        )
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={driverLocation || defaultCenter}
            zoom={14}
            onLoad={setMap}
            options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
            }}
        >
            {/* Driver Marker */}
            {driverLocation && (
                <Marker
                    position={driverLocation}
                    icon={{
                        url: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png', // Truck icon
                        scaledSize: new google.maps.Size(40, 40)
                    }}
                    title="Delivery Driver"
                />
            )}

            {/* Pickup Marker */}
            {pickupLocation && (
                <Marker
                    position={pickupLocation}
                    label="A"
                    title="Pickup Location"
                />
            )}

            {/* Dropoff Marker */}
            {dropoffLocation && (
                <Marker
                    position={dropoffLocation}
                    label="B"
                    title="Dropoff Location"
                />
            )}
        </GoogleMap>
    )
}
