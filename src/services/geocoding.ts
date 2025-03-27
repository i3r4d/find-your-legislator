
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
    // First try '2020 Census State Legislative Districts - Upper' format
    let senateDistricts = geoData['2020 Census State Legislative Districts - Upper'];
    
    // If not found, try 'State Legislative Districts - Upper' format
    if (!senateDistricts || senateDistricts.length === 0) {
      senateDistricts = geoData['State Legislative Districts - Upper'];
    }
    
    // Extract Tennessee State House district (Lower Chamber)
    // First try '2020 Census State Legislative Districts - Lower' format
    let houseDistricts = geoData['2020 Census State Legislative Districts - Lower'];
    
    // If not found, try 'State Legislative Districts - Lower' format
    if (!houseDistricts || houseDistricts.length === 0) {
      houseDistricts = geoData['State Legislative Districts - Lower'];
    }
    
    let senateDistrict: string | undefined;
    let houseDistrict: string | undefined;
    
    if (senateDistricts && senateDistricts.length > 0) {
      // Try multiple field names since API responses can vary
      senateDistrict = senateDistricts[0].SLDUST || senateDistricts[0].SLDU || 
                       senateDistricts[0].NAME?.match(/District\s*(\d+)/i)?.[1];
    }
    
    if (houseDistricts && houseDistricts.length > 0) {
      // Try multiple field names since API responses can vary
      houseDistrict = houseDistricts[0].SLDLST || houseDistricts[0].SLDL || 
                      houseDistricts[0].NAME?.match(/District\s*(\d+)/i)?.[1];
    }
    
    // If we still don't have district info, check for district information in other fields
    if ((!senateDistrict || !houseDistrict) && geoData) {
      // Look for district information in any available field
      Object.entries(geoData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          const entry = value[0];
          
          // Check if this might be a senate district
          if (!senateDistrict && key.toLowerCase().includes('upper') || 
              (entry.NAME && entry.NAME.toLowerCase().includes('senate'))) {
            
            // Extract district number from various possible fields
            senateDistrict = entry.SLDUST || entry.SLDU || 
                            (entry.NAME && entry.NAME.match(/District\s*(\d+)/i)?.[1]) ||
                            entry.BASENAME;
          }
          
          // Check if this might be a house district
          if (!houseDistrict && key.toLowerCase().includes('lower') || 
              (entry.NAME && entry.NAME.toLowerCase().includes('house'))) {
            
            // Extract district number from various possible fields
            houseDistrict = entry.SLDLST || entry.SLDL || 
                           (entry.NAME && entry.NAME.match(/District\s*(\d+)/i)?.[1]) ||
                           entry.BASENAME;
          }
        }
      });
    }
    
    // Ensure we have valid district numbers by removing leading zeros and non-numeric characters
    if (senateDistrict) {
      senateDistrict = senateDistrict.replace(/^0+/, '').trim();
      // Extract just the number if it's a format like "District 6"
      const match = senateDistrict.match(/(\d+)/);
      if (match) {
        senateDistrict = match[1];
      }
    }
    
    if (houseDistrict) {
      houseDistrict = houseDistrict.replace(/^0+/, '').trim();
      // Extract just the number if it's a format like "District 19"
      const match = houseDistrict.match(/(\d+)/);
      if (match) {
        houseDistrict = match[1];
      }
    }
    
    if (!senateDistrict && !houseDistrict) {
      // If we still have no district information, try fallback to TN GIS data lookup
      // This is a secondary method to try to find the district
      console.log("No legislative districts found in primary Census API response, attempting fallback lookup...");
      
      // We'd normally use TN GIS data here, but as a lightweight fallback we'll use the county information
      // from the Census response to help identify potential districts
      const counties = geoData['Counties'];
      if (counties && counties.length > 0) {
        const county = counties[0].NAME;
        console.log(`Location is in ${county}`);
        
        // Log all available geography data for debugging
        console.log("Available geographic data:", Object.keys(geoData));
        
        // We at least got the county, but not enough for a reliable district match
        toast.error(`Could not determine exact legislative districts for this location in ${county}`);
        return null;
      }
      
      toast.error("No legislative districts found for this location in Tennessee.");
      return null;
    }
    
    console.log(`Found legislative districts - Senate: ${senateDistrict}, House: ${houseDistrict}`);
    
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
