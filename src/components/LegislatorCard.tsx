
import React from 'react';
import { Legislator } from '@/types';
import { MapPin, Phone, Mail, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LegislatorCardProps {
  legislator: Legislator;
  chamber: 'senate' | 'house';
}

const LegislatorCard = ({ legislator, chamber }: LegislatorCardProps) => {
  if (!legislator) return null;

  const chamberColor = chamber === 'senate' ? 'bg-blue-50' : 'bg-red-50';
  const chamberBorder = chamber === 'senate' ? 'border-blue-100' : 'border-red-100';
  const chamberText = chamber === 'senate' ? 'State Senator' : 'State Representative';
  
  return (
    <Card className={cn("w-full overflow-hidden border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md", chamberBorder)}>
      <CardHeader className={cn("pb-2", chamberColor)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{chamberText}</p>
            <h3 className="text-xl font-semibold">{legislator.name}</h3>
            <div className="flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1" />
              <p className="text-sm text-gray-500">District {legislator.district}</p>
            </div>
          </div>
          
          {legislator.imageUrl && (
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img
                src={legislator.imageUrl}
                alt={`${legislator.name}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=TN';
                }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-4">
        <div className="space-y-3">
          {legislator.contactInfo.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-blue-600 mr-2" />
              <a 
                href={`tel:${legislator.contactInfo.phone.replace(/[^\d]/g, '')}`} 
                className="text-sm hover:text-blue-700 transition-colors"
              >
                {legislator.contactInfo.phone}
              </a>
            </div>
          )}
          
          {legislator.contactInfo.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-blue-600 mr-2" />
              <a 
                href={`mailto:${legislator.contactInfo.email}`} 
                className="text-sm hover:text-blue-700 transition-colors break-all"
              >
                {legislator.contactInfo.email}
              </a>
            </div>
          )}
          
          <div className="flex items-center space-x-2 pt-1">
            {legislator.contactInfo.facebook && (
              <a 
                href={legislator.contactInfo.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="sr-only">Facebook</span>
              </a>
            )}
            
            {legislator.contactInfo.twitter && (
              <a 
                href={legislator.contactInfo.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Twitter className="h-4 w-4 text-blue-500" />
                <span className="sr-only">Twitter</span>
              </a>
            )}
            
            {legislator.contactInfo.website && (
              <a 
                href={legislator.contactInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Official Website
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegislatorCard;
