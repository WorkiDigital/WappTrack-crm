import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
    status: string;
    stageName?: string | null;   // pipeline stage name (preferred)
    stageColor?: string | null;  // pipeline stage color
    className?: string;
}

const FALLBACK_COLORS: Record<string, string> = {
    new: '#3b82f6',
    contacted: '#06b6d4',
    qualified: '#8b5cf6',
    converted: '#10b981',
    won: '#10b981',
    lost: '#ef4444',
    cancelled: '#6b7280',
};

const FALLBACK_LABELS: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    converted: 'Convertido',
    won: 'Ganho',
    lost: 'Perdido',
    cancelled: 'Cancelado',
};

export const LeadStatusBadge = ({ status, stageName, stageColor, className }: LeadStatusBadgeProps) => {
    const label = stageName || FALLBACK_LABELS[status] || status;
    const color = stageColor || FALLBACK_COLORS[status] || '#6b7280';

    return (
        <Badge
            className={cn('font-medium border-0 text-white', className)}
            style={{ backgroundColor: color }}
        >
            {label}
        </Badge>
    );
};
