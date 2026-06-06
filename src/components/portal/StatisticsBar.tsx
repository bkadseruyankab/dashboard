import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Users,
  FileText,
  Award,
  DollarSign,
  Briefcase,
  Calendar,
  Eye,
  TrendingUp,
  Target,
  BarChart3,
} from 'lucide-react';
import { Statistics } from './types';

interface StatisticsBarProps {
  statistics: Statistics[];
}

const iconMap: Record<string, React.ElementType> = {
  Users: Users,
  users: Users,
  DollarSign: DollarSign,
  dollarsign: DollarSign,
  Building2: Building2,
  building2: Building2,
  building: Building2,
  Briefcase: Briefcase,
  briefcase: Briefcase,
  FileText: FileText,
  filetext: FileText,
  'file-text': FileText,
  Calendar: Calendar,
  calendar: Calendar,
  Eye: Eye,
  eye: Eye,
  TrendingUp: TrendingUp,
  trendingup: TrendingUp,
  'trending-up': TrendingUp,
  Award: Award,
  award: Award,
  Target: Target,
  target: Target,
  BarChart3: BarChart3,
  barchart3: BarChart3,
  'bar-chart': BarChart3,
};

export default function StatisticsBar({ statistics }: StatisticsBarProps) {
  return (
    <section className="bg-emerald-700 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statistics.map((stat) => {
            const Icon = iconMap[stat.icon || 'Building2'] || Building2;
            return (
              <Card key={stat.id} className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4 md:p-6 text-center">
                  <Icon className="h-8 w-8 md:h-10 md:w-10 text-emerald-300 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value.toLocaleString('id-ID')}
                  </div>
                  <div className="text-emerald-100 font-medium text-sm md:text-base">
                    {stat.label}
                  </div>
                  {stat.description && (
                    <div className="text-emerald-200 text-xs mt-1">
                      {stat.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
