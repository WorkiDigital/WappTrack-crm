
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from '@/types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7);
  
  const lastMonthStart = new Date(today);
  lastMonthStart.setMonth(today.getMonth() - 1);
  
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const presetRanges = [
    {
      label: 'Hoje',
      range: { startDate: today, endDate: today }
    },
    {
      label: 'Ontem',
      range: { startDate: yesterday, endDate: yesterday }
    },
    {
      label: 'Últimos 7 dias',
      range: { startDate: lastWeekStart, endDate: today }
    },
    {
      label: 'Este mês',
      range: { startDate: currentMonthStart, endDate: today }
    },
    {
      label: 'Últimos 30 dias',
      range: { startDate: lastMonthStart, endDate: today }
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Período:</span>
          
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onDateRangeChange(preset.range)}
              className={cn(
                "h-8",
                dateRange.startDate.toDateString() === preset.range.startDate.toDateString() &&
                dateRange.endDate.toDateString() === preset.range.endDate.toDateString()
                  ? "bg-primary text-primary-foreground"
                  : ""
              )}
            >
              {preset.label}
            </Button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.startDate, 'dd/MM', { locale: ptBR })} - {format(dateRange.endDate, 'dd/MM', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Data início:</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.startDate}
                      onSelect={(date) => date && onDateRangeChange({ ...dateRange, startDate: date })}
                      className="pointer-events-auto"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data fim:</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.endDate}
                      onSelect={(date) => date && onDateRangeChange({ ...dateRange, endDate: date })}
                      className="pointer-events-auto"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
