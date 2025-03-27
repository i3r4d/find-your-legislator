
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressFormData } from '@/types';
import { geocodeAddress } from '@/services/geocoding';
import AnimatedTransition from './AnimatedTransition';

const AddressForm = () => {
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streetAddress.trim() || !zipCode.trim()) {
      toast.error('Please enter both street address and ZIP code');
      return;
    }
    
    // Validate ZIP code format (Tennessee ZIP codes)
    const zipCodeRegex = /^(37|38)[0-9]{3}$/;
    if (!zipCodeRegex.test(zipCode)) {
      toast.error('Please enter a valid Tennessee ZIP code (starts with 37 or 38)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Geocode the address
      const geocodingResult = await geocodeAddress(streetAddress, zipCode);
      
      if (!geocodingResult) {
        setIsSubmitting(false);
        return; // Error already displayed by geocodeAddress
      }
      
      // Save the form data and geocoding result to sessionStorage
      const formData: AddressFormData = { streetAddress, zipCode };
      sessionStorage.setItem('addressFormData', JSON.stringify(formData));
      sessionStorage.setItem('geocodingResult', JSON.stringify(geocodingResult));
      
      // Navigate to the results page
      navigate('/results');
    } catch (error) {
      console.error('Address submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedTransition show={true} className="w-full max-w-md mx-auto">
      <form 
        onSubmit={handleSubmit} 
        className="glass-panel p-8 rounded-2xl shadow-xl border border-white/20"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="street-address" className="text-sm font-medium">
              Street Address
            </Label>
            <Input
              id="street-address"
              type="text"
              placeholder="123 Main St"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              required
              className="h-12 bg-white/70 border border-gray-200 rounded-xl px-4"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zip-code" className="text-sm font-medium">
              ZIP Code
            </Label>
            <Input
              id="zip-code"
              type="text"
              placeholder="37203"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
              pattern="[0-9]{5}"
              required
              className="h-12 bg-white/70 border border-gray-200 rounded-xl px-4"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State
            </Label>
            <Input
              id="state"
              type="text"
              value="Tennessee"
              readOnly
              disabled
              className="h-12 bg-gray-100/70 border border-gray-200 rounded-xl px-4 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Pre-selected, not editable</p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? 'Finding Your Legislators...' : 'Find My Legislators'}
          </Button>
        </div>
      </form>
    </AnimatedTransition>
  );
};

export default AddressForm;
