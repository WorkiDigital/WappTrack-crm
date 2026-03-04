
import React from 'react';
import { Input } from "@/components/ui/input";

interface CampaignFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="flex items-center">
      <Input
        placeholder="Buscar campanhas..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};

export default CampaignFilters;
