import React from 'react';
import { Lead } from '@/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadWithUnread extends Lead {
  unread_count?: number;
}

interface ConversationListProps {
  leads: LeadWithUnread[];
  isLoading: boolean;
  selectedLead: LeadWithUnread | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectLead: (lead: LeadWithUnread) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  leads,
  isLoading,
  selectedLead,
  searchTerm,
  onSearchChange,
  onSelectLead,
  hasMore,
  isFetchingMore,
  onLoadMore,
}) => {
  const formatMessageDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    }
    if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Conversas
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="divide-y p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/6" />
                  </div>
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={cn(
                  'w-full p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left',
                  selectedLead?.id === lead.id && 'bg-accent'
                )}
              >
                {/* Avatar with unread badge */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lead.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(lead.name)}
                    </AvatarFallback>
                  </Avatar>
                  {(lead.unread_count ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center animate-in zoom-in-50 duration-200">
                      {(lead.unread_count ?? 0) > 99 ? '99+' : lead.unread_count}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "truncate",
                      (lead.unread_count ?? 0) > 0 ? "font-bold" : "font-medium"
                    )}>
                      {lead.name}
                    </span>
                    <span className={cn(
                      "text-xs flex-shrink-0",
                      (lead.unread_count ?? 0) > 0 ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>
                      {formatMessageDate(lead.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {formatBrazilianPhone(lead.phone)}
                  </p>
                  {lead.last_message && (
                    <p className={cn(
                      "text-sm truncate mt-1",
                      (lead.unread_count ?? 0) > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}>
                      {lead.last_message}
                    </p>
                  )}
                </div>
              </button>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <button
                  onClick={onLoadMore}
                  disabled={isFetchingMore}
                  className="text-sm text-primary hover:underline flex items-center gap-2 disabled:opacity-50"
                  type="button"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais conversas'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
