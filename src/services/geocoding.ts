
import { GeocodingResult } from '../types';
import { toast } from '@/components/ui/sonner';

const OPENCAGE_API_KEY = "6f7cd6fba3ee400b967a9ddbb1af2103"; // This is a registered free API key for this demo

export async function geocodeAddress(address: string, zipCode: string): Promise<GeocodingResult | null> {
  try {
    const fullAddress = `${address}, ${zipCode}, Tennessee, USA`;
    const query = encodeURIComponent(fullAddress);
    
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${OPENCAGE_API_KEY}&countrycode=us&limit=1`
    );

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();
    
    if (data.results.length === 0) {
      toast.error("Address not found. Please check your address and ZIP code.");
      return null;
    }

    const result = data.results[0];
    
    // Check if the address is in Tennessee
    const isInTennessee = 
      result.components.state === 'Tennessee' || 
      result.components.state_code === 'TN';
      
    if (!isInTennessee) {
      toast.error("The address must be in Tennessee.");
      return null;
    }

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      formattedAddress: result.formatted
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    toast.error("Error finding your address. Please try again.");
    return null;
  }
}

// This function will need to be implemented with actual district data
// For now, it's a placeholder that will be replaced with actual implementation
export async function findLegislativeDistrict(lat: number, lng: number): Promise<{senate?: string, house?: string} | null> {
  // In a real implementation, we would use a service that provides legislative districts based on lat/lng
  // For now, we'll simulate this with the scraping service we'll build

  try {
    // This would typically call a district lookup API or use GIS data
    // For the initial version, we'll implement a workaround in the legislator service
    
    return {
      senate: "pending", // Will be determined by the legislator service
      house: "pending"  // Will be determined by the legislator service
    };
  } catch (error) {
    console.error('District lookup error:', error);
    toast.error("Error finding your legislative district. Please try again.");
    return null;
  }
}
