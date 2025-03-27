
import { GeocodingResult } from '../types';
import { toast } from '@/utils/toast';

// For demonstration purposes, we'll simulate NAD validation
// In production, this would connect to the actual NAD API
export async function geocodeAddress(address: string, zipCode: string): Promise<GeocodingResult | null> {
  try {
    // In a production app, we would call the NAD API for address validation
    // For this demo, we'll simulate a successful validation and geocoding
    
    // Verify Tennessee ZIP code pattern
    const zipCodePattern = /^(37|38)[0-9]{3}$/;
    if (!zipCodePattern.test(zipCode)) {
      toast.error("Please enter a valid Tennessee ZIP code (starts with 37 or 38).");
      return null;
    }
    
    // Format the address for geocoding
    const fullAddress = `${address}, ${zipCode}, Tennessee, USA`;
    
    // Since the OpenCage API key is invalid, let's use a free alternative for the demo
    // In production, we would use the NAD API endpoint
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&countrycodes=us&limit=1`
    );

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      toast.error("Address not found. Please check your address and ZIP code.");
      return null;
    }

    const result = data[0];
    
    // Get district information using the USgeocoder simulation
    const districtInfo = await findLegislativeDistrict(
      parseFloat(result.lat), 
      parseFloat(result.lon)
    );
    
    if (!districtInfo) {
      toast.error("Could not determine legislative districts for this address.");
      return null;
    }
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name,
      district: districtInfo
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    toast.error("Error finding your address. Please try again.");
    return null;
  }
}

// Simulate USgeocoder Legislative District Mapping API
// In production, this would connect to the actual USgeocoder API
export async function findLegislativeDistrict(lat: number, lng: number): Promise<{senate?: string, house?: string} | null> {
  try {
    // In production, we would call the USgeocoder API with the coordinates
    // For the demo, we'll simulate a response based on the coordinates
    
    // This is a simplified simulation - in a real implementation,
    // we'd call the actual USgeocoder API with proper authentication
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For Tennessee, senate districts range from 1-33 and house districts from 1-99
    // Generate simulated district numbers based on coordinates for the demo
    // In production, these would come from the actual API response
    const senateDistrictNumber = Math.floor(Math.abs(Math.sin(lat * lng) * 33)) + 1;
    const houseDistrictNumber = Math.floor(Math.abs(Math.cos(lat * lng) * 99)) + 1;
    
    return {
      senate: senateDistrictNumber.toString(),
      house: houseDistrictNumber.toString()
    };
  } catch (error) {
    console.error('District lookup error:', error);
    toast.error("Error finding your legislative district. Please try again.");
    return null;
  }
}
