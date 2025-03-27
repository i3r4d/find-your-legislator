import { Legislator } from '../types';
import { toast } from '@/utils/toast';

// This service will handle fetching TN legislator data
// In a production app, we would build a proper backend API that scrapes and caches the data
// For this demo, we'll use client-side scraping with a CORS proxy

const CORS_PROXY = 'https://corsproxy.io/?';

// Fetch and parse legislator data from the TN legislature website
export async function fetchLegislators(): Promise<Legislator[]> {
  try {
    const senatorsPromise = fetchSenateLegislators();
    const representativesPromise = fetchHouseLegislators();
    
    const [senators, representatives] = await Promise.all([senatorsPromise, representativesPromise]);
    
    return [...senators, ...representatives];
  } catch (error) {
    console.error('Error fetching legislators:', error);
    toast.error("Error loading legislator data. Please try again later.");
    return [];
  }
}

// Fetch Senate legislators
async function fetchSenateLegislators(): Promise<Legislator[]> {
  try {
    const response = await fetch(
      `${CORS_PROXY}https://wapp.capitol.tn.gov/apps/LegislatorInfo/directory.aspx?chamber=S`
    );
    
    if (!response.ok) throw new Error('Failed to fetch Senate data');
    
    const html = await response.text();
    
    // Parse the HTML to extract legislator information
    // This is a simplified version for demo purposes
    const senators = parseSenateLegislators(html);
    return senators;
  } catch (error) {
    console.error('Error fetching senate legislators:', error);
    return [];
  }
}

// Fetch House legislators
async function fetchHouseLegislators(): Promise<Legislator[]> {
  try {
    const response = await fetch(
      `${CORS_PROXY}https://wapp.capitol.tn.gov/apps/LegislatorInfo/directory.aspx?chamber=H`
    );
    
    if (!response.ok) throw new Error('Failed to fetch House data');
    
    const html = await response.text();
    
    // Parse the HTML to extract legislator information
    const representatives = parseHouseLegislators(html);
    return representatives;
  } catch (error) {
    console.error('Error fetching house legislators:', error);
    return [];
  }
}

// Parse Senate legislators from HTML
function parseSenateLegislators(html: string): Legislator[] {
  const senators: Legislator[] = [];
  
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all legislator cards/rows in the HTML
  const legislatorElements = doc.querySelectorAll('.senatorContainer');
  
  legislatorElements.forEach((el, index) => {
    try {
      // Extract data from each element
      const nameElement = el.querySelector('.senator-name, strong');
      const districtElement = el.querySelector('.senatorDistrict, p');
      const imgElement = el.querySelector('img');
      
      // Contact info
      const phoneElement = el.querySelector('a[href^="tel:"]');
      const emailElement = el.querySelector('a[href^="mailto:"]');
      
      // Social media - these selectors will need to be adjusted based on actual HTML structure
      const facebookElement = el.querySelector('a[href*="facebook.com"]');
      const twitterElement = el.querySelector('a[href*="twitter.com"]');
      
      if (nameElement && districtElement) {
        const name = nameElement.textContent?.trim() || '';
        const districtText = districtElement.textContent?.trim() || '';
        const districtMatch = districtText.match(/District\s*(\d+)/i);
        const district = districtMatch ? districtMatch[1] : '';
        
        const imageUrl = imgElement?.getAttribute('src') || undefined;
        
        // Build the legislator object
        const senator: Legislator = {
          id: `senate-${index}`,
          chamber: 'senate',
          name,
          district,
          party: districtText.includes('Republican') ? 'Republican' : 
                 districtText.includes('Democrat') ? 'Democrat' : 'Unknown',
          imageUrl: imageUrl ? `https://wapp.capitol.tn.gov${imageUrl}` : undefined,
          contactInfo: {
            phone: phoneElement?.textContent?.trim() || phoneElement?.getAttribute('href')?.replace('tel:', '') || undefined,
            email: emailElement?.textContent?.trim() || emailElement?.getAttribute('href')?.replace('mailto:', '') || undefined,
            facebook: facebookElement?.getAttribute('href') || undefined,
            twitter: twitterElement?.getAttribute('href') || undefined,
          }
        };
        
        senators.push(senator);
      }
    } catch (error) {
      console.error('Error parsing senator element:', error);
    }
  });
  
  return senators;
}

// Parse House legislators from HTML
function parseHouseLegislators(html: string): Legislator[] {
  const representatives: Legislator[] = [];
  
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all legislator cards/rows in the HTML
  const legislatorElements = doc.querySelectorAll('.repContainer');
  
  legislatorElements.forEach((el, index) => {
    try {
      // Extract data from each element
      const nameElement = el.querySelector('.rep-name, strong');
      const districtElement = el.querySelector('.repDistrict, p');
      const imgElement = el.querySelector('img');
      
      // Contact info
      const phoneElement = el.querySelector('a[href^="tel:"]');
      const emailElement = el.querySelector('a[href^="mailto:"]');
      
      // Social media - these selectors will need to be adjusted based on actual HTML structure
      const facebookElement = el.querySelector('a[href*="facebook.com"]');
      const twitterElement = el.querySelector('a[href*="twitter.com"]');
      
      if (nameElement && districtElement) {
        const name = nameElement.textContent?.trim() || '';
        const districtText = districtElement.textContent?.trim() || '';
        const districtMatch = districtText.match(/District\s*(\d+)/i);
        const district = districtMatch ? districtMatch[1] : '';
        
        const imageUrl = imgElement?.getAttribute('src') || undefined;
        
        // Build the legislator object
        const representative: Legislator = {
          id: `house-${index}`,
          chamber: 'house',
          name,
          district,
          party: districtText.includes('Republican') ? 'Republican' : 
                 districtText.includes('Democrat') ? 'Democrat' : 'Unknown',
          imageUrl: imageUrl ? `https://wapp.capitol.tn.gov${imageUrl}` : undefined,
          contactInfo: {
            phone: phoneElement?.textContent?.trim() || phoneElement?.getAttribute('href')?.replace('tel:', '') || undefined,
            email: emailElement?.textContent?.trim() || emailElement?.getAttribute('href')?.replace('mailto:', '') || undefined,
            facebook: facebookElement?.getAttribute('href') || undefined,
            twitter: twitterElement?.getAttribute('href') || undefined,
          }
        };
        
        representatives.push(representative);
      }
    } catch (error) {
      console.error('Error parsing representative element:', error);
    }
  });
  
  return representatives;
}

// Find legislators by district information
export async function findLegislatorsByLocation(formattedAddress: string, districtInfo?: {senate?: string, house?: string}): Promise<{ senator: Legislator | null, representative: Legislator | null }> {
  try {
    // Fetch all legislators first
    const allLegislators = await fetchLegislators();
    
    if (allLegislators.length === 0) {
      throw new Error('No legislator data available');
    }
    
    let matchedSenator = null;
    let matchedRepresentative = null;
    
    // If we have district information from USgeocoder (simulated),
    // use it to find the correct legislators
    if (districtInfo) {
      const senateDistrict = districtInfo.senate;
      const houseDistrict = districtInfo.house;
      
      if (senateDistrict) {
        matchedSenator = allLegislators.find(
          leg => leg.chamber === 'senate' && leg.district === senateDistrict
        );
      }
      
      if (houseDistrict) {
        matchedRepresentative = allLegislators.find(
          leg => leg.chamber === 'house' && leg.district === houseDistrict
        );
      }
    }
    
    // If we couldn't find matches using district info, try the address components
    // This is a fallback method
    if (!matchedSenator || !matchedRepresentative) {
      const addressLower = formattedAddress.toLowerCase();
      const senators = allLegislators.filter(leg => leg.chamber === 'senate');
      const representatives = allLegislators.filter(leg => leg.chamber === 'house');
      
      if (!matchedSenator) {
        matchedSenator = senators.find(s => 
          addressLower.includes(`district ${s.district}`) || 
          addressLower.includes(`district${s.district}`)
        );
      }
      
      if (!matchedRepresentative) {
        matchedRepresentative = representatives.find(r => 
          addressLower.includes(`district ${r.district}`) || 
          addressLower.includes(`district${r.district}`)
        );
      }
      
      // If still no matches, use random legislators for demonstration purposes
      // NOTE: In a production app, we'd return null instead of random legislators
      if (!matchedSenator && senators.length > 0) {
        const randomIndex = Math.floor(Math.random() * senators.length);
        matchedSenator = senators[randomIndex];
      }
      
      if (!matchedRepresentative && representatives.length > 0) {
        const randomIndex = Math.floor(Math.random() * representatives.length);
        matchedRepresentative = representatives[randomIndex];
      }
    }
    
    return {
      senator: matchedSenator,
      representative: matchedRepresentative
    };
  } catch (error) {
    console.error('Error finding legislators by location:', error);
    toast.error("Error matching your address to legislators. Please try again later.");
    return { senator: null, representative: null };
  }
}

// Additional function to get a specific legislator by ID (for detail pages)
export async function getLegislatorById(id: string): Promise<Legislator | null> {
  try {
    const legislators = await fetchLegislators();
    return legislators.find(leg => leg.id === id) || null;
  } catch (error) {
    console.error('Error getting legislator by ID:', error);
    return null;
  }
}
