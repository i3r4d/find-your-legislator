
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Legislator } from '@/types';
import { toast } from '@/components/ui/sonner';

interface QRCodeGeneratorProps {
  legislators: { senator: Legislator | null; representative: Legislator | null };
  address: string;
}

const QRCodeGenerator = ({ legislators, address }: QRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a VCard-formatted contact card for QR code
  const generateContactData = () => {
    let contactData = `LEGISLATOR CONTACT INFO\n\n`;
    
    if (legislators.senator) {
      contactData += `STATE SENATOR - DISTRICT ${legislators.senator.district}\n`;
      contactData += `${legislators.senator.name}\n`;
      
      if (legislators.senator.contactInfo.phone) {
        contactData += `Phone: ${legislators.senator.contactInfo.phone}\n`;
      }
      
      if (legislators.senator.contactInfo.email) {
        contactData += `Email: ${legislators.senator.contactInfo.email}\n`;
      }
      
      contactData += `\n`;
    }
    
    if (legislators.representative) {
      contactData += `STATE REPRESENTATIVE - DISTRICT ${legislators.representative.district}\n`;
      contactData += `${legislators.representative.name}\n`;
      
      if (legislators.representative.contactInfo.phone) {
        contactData += `Phone: ${legislators.representative.contactInfo.phone}\n`;
      }
      
      if (legislators.representative.contactInfo.email) {
        contactData += `Email: ${legislators.representative.contactInfo.email}\n`;
      }
    }
    
    contactData += `\nAddress: ${address}`;
    
    return encodeURIComponent(contactData);
  };

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const contactData = generateContactData();
      
      // Using the QR Code Generator API
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${contactData}&size=200x200&margin=10`;
      setQrCodeUrl(qrCodeApiUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'tn-legislators-contact.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (legislators.senator || legislators.representative) {
      generateQRCode();
    }
  }, [legislators]);

  return (
    <div className="flex flex-col items-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium mb-3">Legislator Contact QR Code</h3>
      
      {isLoading ? (
        <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
          <p className="text-sm text-gray-500">Generating...</p>
        </div>
      ) : qrCodeUrl ? (
        <div className="flex flex-col items-center">
          <img 
            src={qrCodeUrl} 
            alt="QR Code with legislator contact information" 
            className="w-48 h-48 rounded-lg border border-gray-200 shadow-sm mb-3" 
          />
          <p className="text-xs text-gray-500 mb-2 text-center">
            Scan to save your legislators' contact information
          </p>
          <Button 
            onClick={downloadQRCode}
            variant="outline" 
            size="sm"
            className="text-sm"
          >
            Download QR Code
          </Button>
        </div>
      ) : (
        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-sm text-gray-500">QR code unavailable</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
