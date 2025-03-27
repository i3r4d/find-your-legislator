
import React, { useEffect } from 'react';
import AddressForm from '@/components/AddressForm';
import AnimatedTransition from '@/components/AnimatedTransition';

const Index = () => {
  // Clear any previous session data when landing on the home page
  useEffect(() => {
    sessionStorage.removeItem('addressFormData');
    sessionStorage.removeItem('geocodingResult');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <AnimatedTransition show={true} className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
            Find Your Tennessee Legislators
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your home address to connect with your state senator and representative.
          </p>
        </AnimatedTransition>
        
        <AddressForm />
        
        <AnimatedTransition show={true} className="mt-8 text-center text-sm text-gray-500 max-w-md">
          <p>
            This app provides accurate information about your Tennessee state legislators
            based on your residential address.
          </p>
        </AnimatedTransition>
      </div>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200">
        <p>Using official data from the Tennessee General Assembly</p>
      </footer>
    </div>
  );
};

export default Index;
