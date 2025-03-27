
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { AddressFormData, GeocodingResult, Legislator } from '@/types';
import LegislatorCard from '@/components/LegislatorCard';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import AnimatedTransition from '@/components/AnimatedTransition';
import { findLegislatorsByLocation } from '@/services/legislatorService';

const Results = () => {
  const [formData, setFormData] = useState<AddressFormData | null>(null);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [legislators, setLegislators] = useState<{
    senator: Legislator | null;
    representative: Legislator | null;
  }>({
    senator: null,
    representative: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve stored data from sessionStorage
    const storedFormData = sessionStorage.getItem('addressFormData');
    const storedGeocodingResult = sessionStorage.getItem('geocodingResult');
    
    if (!storedFormData || !storedGeocodingResult) {
      // If no data is found, redirect back to the form
      toast.error('Please enter your address first');
      navigate('/');
      return;
    }
    
    try {
      // Parse the stored data
      const parsedFormData: AddressFormData = JSON.parse(storedFormData);
      const parsedGeocodingResult: GeocodingResult = JSON.parse(storedGeocodingResult);
      
      setFormData(parsedFormData);
      setGeocodingResult(parsedGeocodingResult);
      
      // Find legislators based on the geocoding result
      fetchLegislators(parsedGeocodingResult);
    } catch (error) {
      console.error('Error retrieving stored data:', error);
      toast.error('An error occurred. Please try again.');
      navigate('/');
    }
  }, [navigate]);

  const fetchLegislators = async (geoResult: GeocodingResult) => {
    setIsLoading(true);
    
    try {
      console.log('Fetching legislators for address:', geoResult.formattedAddress);
      console.log('District information:', geoResult.district);
      
      // Find legislators based on the geocoding result
      const matchedLegislators = await findLegislatorsByLocation(
        geoResult.formattedAddress || '',
        geoResult.district
      );
      
      setLegislators(matchedLegislators);
      
      // Check if we found at least one legislator
      if (!matchedLegislators.senator && !matchedLegislators.representative) {
        console.error('No legislators found for district info:', geoResult.district);
        toast.error(
          'Unable to find legislators for your address. Please verify your address or contact the TN Secretary of State for assistance.'
        );
      } else {
        console.log('Successfully found legislators:', 
          matchedLegislators.senator ? `Senator: ${matchedLegislators.senator.name}` : 'No senator found',
          matchedLegislators.representative ? `Representative: ${matchedLegislators.representative.name}` : 'No representative found'
        );
      }
    } catch (error) {
      console.error('Error fetching legislators:', error);
      toast.error('Error finding your legislators. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-10">
        <AnimatedTransition show={true} className="mb-8">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="mb-6"
          >
            ← Back to Address Form
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Tennessee Legislators</h1>
          
          {geocodingResult?.formattedAddress && (
            <p className="text-gray-600 mb-6">
              Based on your address: <span className="font-medium">{geocodingResult.formattedAddress}</span>
            </p>
          )}
        </AnimatedTransition>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Finding your legislators...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedTransition 
              show={Boolean(legislators.senator)} 
              className="col-span-1"
            >
              {legislators.senator && (
                <LegislatorCard 
                  legislator={legislators.senator} 
                  chamber="senate" 
                />
              )}
            </AnimatedTransition>
            
            <AnimatedTransition 
              show={Boolean(legislators.representative)} 
              className="col-span-1"
            >
              {legislators.representative && (
                <LegislatorCard 
                  legislator={legislators.representative} 
                  chamber="house" 
                />
              )}
            </AnimatedTransition>
            
            {(!legislators.senator && !legislators.representative) && (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-600">
                  No legislators found for your address. Please verify your address is in Tennessee
                  or contact the Secretary of State for assistance.
                </p>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && (legislators.senator || legislators.representative) && (
          <AnimatedTransition show={true} className="mt-10">
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Save Your Legislators' Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-gray-600">
                    Contact your legislators about issues that matter to you. Scan the QR code
                    with your phone's camera to save their contact information.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {legislators.senator?.contactInfo.phone && (
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        asChild
                      >
                        <a href={`tel:${legislators.senator.contactInfo.phone.replace(/[^\d]/g, '')}`}>
                          Call Senator
                        </a>
                      </Button>
                    )}
                    
                    {legislators.representative?.contactInfo.phone && (
                      <Button 
                        variant="outline"
                        className="text-sm"
                        asChild
                      >
                        <a href={`tel:${legislators.representative.contactInfo.phone.replace(/[^\d]/g, '')}`}>
                          Call Representative
                        </a>
                      </Button>
                    )}
                    
                    {legislators.senator?.contactInfo.email && (
                      <Button 
                        variant="outline"
                        className="text-sm"
                        asChild
                      >
                        <a href={`mailto:${legislators.senator.contactInfo.email}`}>
                          Email Senator
                        </a>
                      </Button>
                    )}
                    
                    {legislators.representative?.contactInfo.email && (
                      <Button 
                        variant="outline"
                        className="text-sm"
                        asChild
                      >
                        <a href={`mailto:${legislators.representative.contactInfo.email}`}>
                          Email Representative
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-1">
                  {geocodingResult?.formattedAddress && (
                    <QRCodeGenerator 
                      legislators={legislators} 
                      address={geocodingResult.formattedAddress}
                    />
                  )}
                </div>
              </div>
            </div>
          </AnimatedTransition>
        )}
      </div>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200">
        <p>Using official data from the Tennessee General Assembly</p>
      </footer>
    </div>
  );
};

export default Results;
