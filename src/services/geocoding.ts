
import { GeocodingResult } from '../types';
import { toast } from '@/utils/toast';

// Use free, open-source data sources for address validation and geocoding
export async function geocodeAddress(address: string, zipCode: string): Promise<GeocodingResult | null> {
  try {
    // Verify Tennessee ZIP code pattern
    const zipCodePattern = /^(37|38)[0-9]{3}$/;
    if (!zipCodePattern.test(zipCode)) {
      toast.error("Please enter a valid Tennessee ZIP code (starts with 37 or 38).");
      return null;
    }
    
    // Format the address for geocoding
    const fullAddress = `${address}, ${zipCode}, Tennessee, USA`;
    
    // Use a CORS proxy to access the Census Bureau Geocoder API
    // This is necessary because the Census API doesn't support CORS for browser requests
    const encodedAddress = encodeURIComponent(fullAddress);
    const proxyUrl = 'https://corsproxy.io/?';
    const censusGeocodeUrl = `${proxyUrl}${encodeURIComponent('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=' + encodedAddress + '&benchmark=2020&format=json')}`;
    
    console.log('Sending geocoding request to:', censusGeocodeUrl);
    const response = await fetch(censusGeocodeUrl);

    if (!response.ok) {
      console.error('Census API response not OK:', response.status, response.statusText);
      throw new Error(`Census Bureau Geocoding API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Census API response received:', data);
    
    // Check if we have valid matches from the Census Bureau Geocoder
    if (!data.result || !data.result.addressMatches || data.result.addressMatches.length === 0) {
      toast.error("Address not found. Please check your address and ZIP code.");
      return null;
    }

    // Get the best match
    const bestMatch = data.result.addressMatches[0];
    const coordinates = bestMatch.coordinates;
    const formattedAddress = bestMatch.matchedAddress;
    
    // Get district information using the Census Bureau API
    const districtInfo = await findLegislativeDistrict(
      coordinates.y, // latitude
      coordinates.x  // longitude
    );
    
    if (!districtInfo) {
      toast.error("Could not determine legislative districts for this address.");
      return null;
    }
    
    return {
      lat: coordinates.y,
      lng: coordinates.x,
      formattedAddress: formattedAddress,
      district: districtInfo
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    toast.error("Error finding your address. Please try again.");
    return null;
  }
}

// Use U.S. Census Bureau API to find legislative districts
export async function findLegislativeDistrict(lat: number, lng: number): Promise<{senate?: string, house?: string} | null> {
  try {
    // Census Bureau API for legislative district lookup
    // This uses the Geocoder with Census Geographies to identify the correct legislative districts
    const proxyUrl = 'https://corsproxy.io/?';
    const url = `${proxyUrl}${encodeURIComponent('https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=' + lng + '&y=' + lat + '&benchmark=2020&vintage=2020&layers=all&format=json')}`;
    
    console.log('Sending district lookup request to:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Census API district response not OK:', response.status, response.statusText);
      throw new Error(`Census Bureau District API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Census API district response received:', data);
    
    // Extract state legislative district information from the response
    // The Census API provides both upper (Senate) and lower (House) state legislative districts
    const geoData = data.result?.geographies;
    
    if (!geoData) {
      toast.error("Could not retrieve district information from Census Bureau.");
      return null;
    }
    
    // Extract Tennessee State Senate district (Upper Chamber)
    const senateDistricts = geoData['2020 Census State Legislative Districts - Upper'];
    const houseDistricts = geoData['2020 Census State Legislative Districts - Lower'];
    
    let senateDistrict: string | undefined;
    let houseDistrict: string | undefined;
    
    if (senateDistricts && senateDistricts.length > 0) {
      // The SLDUST field contains the Senate district number
      senateDistrict = senateDistricts[0].SLDUST;
    }
    
    if (houseDistricts && houseDistricts.length > 0) {
      // The SLDLST field contains the House district number
      houseDistrict = houseDistricts[0].SLDLST;
    }
    
    // Ensure we have valid district numbers by removing leading zeros and non-numeric characters
    if (senateDistrict) {
      senateDistrict = senateDistrict.replace(/^0+/, '');
    }
    
    if (houseDistrict) {
      houseDistrict = houseDistrict.replace(/^0+/, '');
    }
    
    if (!senateDistrict && !houseDistrict) {
      toast.error("No legislative districts found for this location in Tennessee.");
      return null;
    }
    
    return {
      senate: senateDistrict,
      house: houseDistrict
    };
  } catch (error) {
    console.error('District lookup error:', error);
    toast.error("Error finding your legislative district. Please try again.");
    return null;
  }
}
