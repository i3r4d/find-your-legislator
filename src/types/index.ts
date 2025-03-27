
export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
  district?: {
    senate?: string;
    house?: string;
  };
}

export interface Legislator {
  id: string;
  chamber: 'senate' | 'house';
  name: string;
  district: string;
  party: string;
  imageUrl?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  committees?: string[];
  biography?: string;
}

export interface AddressFormData {
  streetAddress: string;
  zipCode: string;
}
