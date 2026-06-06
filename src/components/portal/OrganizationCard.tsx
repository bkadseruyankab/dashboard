import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone } from 'lucide-react';
import { Organization } from './types';

interface OrganizationCardProps {
  organization: Organization;
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'border-emerald-500';
      case 2:
        return 'border-blue-500';
      case 3:
        return 'border-orange-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Card className={`h-full border-t-4 ${getLevelColor(organization.level)} hover:shadow-lg transition-shadow`}>
      <CardContent className="p-6 text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-gray-100">
          <AvatarImage src={organization.photo || undefined} alt={organization.name} />
          <AvatarFallback className="bg-emerald-600 text-white text-xl">
            {getInitials(organization.name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-lg mb-1">{organization.name}</h3>
        <p className="text-emerald-600 font-medium mb-3">{organization.position}</p>
        {organization.description && (
          <p className="text-gray-600 text-sm mb-3">{organization.description}</p>
        )}
        <div className="space-y-1 text-sm text-gray-500">
          {organization.email && (
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${organization.email}`} className="hover:text-emerald-600">
                {organization.email}
              </a>
            </div>
          )}
          {organization.phone && (
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${organization.phone}`} className="hover:text-emerald-600">
                {organization.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
