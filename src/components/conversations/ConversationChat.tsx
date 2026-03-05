import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lead } from '@/types';
import { useLeadChat } from '@/hooks/useLeadChat';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Loader2, Image as ImageIcon, Video, Volume2, X, Phone, ChevronDown, FileText, Download, Check, CheckCheck, Bot, Sparkles, Info, Settings } from 'lucide-react';
import LeadDetailDialog from '@/components/leads/LeadDetailDialog';
import { AudioPlayer } from './AudioPlayer';
import { agentService } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MediaInput } from '@/components/leads/MediaInput';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { ACTIVE_FUNNEL_STATUSES, FINAL_STATUSES, FunnelStatus, getStatusLabel } from '@/constants/funnelStatuses';
import { updateLead } from '@/services/dataService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversationChatProps {
  lead: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export const ConversationChat: React.FC<ConversationChatProps> = ({ lead, onLeadUpdate }) => {
  const { messages, loading, sending, sendMessage, sendMediaMessage } = useLeadChat(
    lead?.id || '',
    lead?.phone || ''
  );
  const [inputMessage, setInputMessage] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' | 'audio'; file: File } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allStatuses: FunnelStatus[] = [...ACTIVE_FUNNEL_STATUSES, ...FINAL_STATUSES];

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Limpar input ao trocar de lead
  useEffect(() => {
    setInputMessage('');
    setMediaPreview(null);
  }, [lead?.id]);

  const handleStatusChange = async (newStatus: FunnelStatus) => {
    if (!lead || lead.status === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedLead = await updateLead(lead.id, { status: newStatus });
      toast.success(`Lead movido para "${getStatusLabel(newStatus)}"`);
      onLeadUpdate?.(updatedLead);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do lead');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleAI = async () => {
    if (!lead) return;
    setIsUpdatingAI(true);
    try {
      const { data: agents } = await supabase.from('agents').select('id').eq('is_active', true).limit(1);
      const defaultAgentId = agents && agents.length > 0 ? agents[0].id : null;

      const newAgentId = lead.agent_id ? null : defaultAgentId;

      const updatedLead = await updateLead(lead.id, { agent_id: newAgentId });
      toast.success(newAgentId ? 'IA Ativada para este lead' : 'IA Desativada para este lead');
      onLeadUpdate?.(updatedLead);
    } catch (error) {
      console.error('Erro ao atualizar IA:', error);
      toast.error('Erro ao atualizar IA do lead');
    } finally {
      setIsUpdatingAI(false);
    }
  };

  const handleSaveLead = async (data: Partial<Lead>) => {
    if (!lead) return;
    try {
      const updated = await updateLead(lead.id, data);
      onLeadUpdate?.(updated);
      toast.success('Lead atualizado');
    } catch (error) {
      toast.error('Erro ao salvar lead');
    }
  };

  const handleSend = async () => {
    if (sending || !lead) return;

    if (mediaPreview) {
      await sendMediaMessage(mediaPreview.file, mediaPreview.type, inputMessage || undefined);
      setMediaPreview(null);
      setInputMessage('');
    } else if (inputMessage.trim()) {
      await sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  const handleMediaSelect = (file: File, type: 'image' | 'video' | 'audio') => {
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type, file });
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openWhatsApp = () => {
    if (lead) {
      const phone = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  if (!lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
        <MessageCircle className="h-20 w-20 mb-4 opacity-20" />
        <p className="text-xl font-medium">Selecione uma conversa</p>
        <p className="text-sm mt-1">Escolha um lead na lista para ver as mensagens</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={lead.profile_picture_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{lead.name}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {formatBrazilianPhone(lead.phone)}
            </p>
          </div>
          {lead.agent_id && (
            <Badge
              variant="secondary"
              className="ml-2 gap-1 bg-primary/10 text-primary border-primary/20 animate-pulse cursor-pointer hover:bg-primary/20"
              onClick={handleToggleAI}
              title="Clique para desativar a IA"
            >
              <Sparkles className="h-3 w-3" />
              IA Ativa
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!lead.agent_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAI}
              className="gap-2 border-dashed"
              disabled={isUpdatingAI}
            >
              <Bot className="h-4 w-4" />
              Ativar IA
            </Button>
          )}
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isUpdatingStatus} className="gap-1">
                <LeadStatusBadge status={lead.status} />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allStatuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    "cursor-pointer",
                    lead.status === status && "bg-accent"
                  )}
                >
                  <LeadStatusBadge status={status} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(true)} title="Ver Detalhes">
            <Info className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={openWhatsApp} title="Abrir no WhatsApp">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <LeadDetailDialog
        lead={lead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSave={handleSaveLead}
        onOpenWhatsApp={openWhatsApp}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-16 w-16 mb-3 opacity-20" />
            <p className="text-base font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Comece a conversa enviando uma mensagem abaixo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.is_from_me ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-3 py-2',
                    message.is_from_me
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  {/* Media Rendering */}
                  {message.media_type === 'image' && message.media_url && (
                    <div className="mb-2 overflow-hidden rounded-lg border bg-black/5">
                      <img
                        src={message.media_url}
                        alt="Imagem enviada"
                        className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.media_url!, '_blank')}
                      />
                    </div>
                  )}

                  {message.media_type === 'video' && message.media_url && (
                    <div className="mb-2 overflow-hidden rounded-lg border bg-black">
                      <video
                        src={message.media_url}
                        controls
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}

                  {message.media_type === 'audio' && (
                    <div className="mb-1">
                      <AudioPlayer
                        src={message.media_url && message.media_url !== 'BASE64_SENT'
                          ? message.media_url
                          : null}
                        isFromMe={message.is_from_me}
                      />
                    </div>
                  )}

                  {message.media_type === 'document' && message.media_url && (
                    <div className={cn(
                      "mb-2 flex items-center gap-3 p-3 rounded-lg border",
                      message.is_from_me ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-background border-border"
                    )}>
                      <FileText className="h-8 w-8 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{message.file_name || 'Documento'}</p>
                        <p className="text-xs opacity-70">Arquivo</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(message.media_url!, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {message.media_type !== 'audio' && message.message_text && (
                    <p className="text-sm shadow-text whitespace-pre-wrap break-words">
                      {message.message_text}
                    </p>
                  )}
                  <div
                    className={cn(
                      'flex items-center gap-2 mt-1',
                      message.is_from_me
                        ? 'justify-end text-primary-foreground/70'
                        : 'justify-end text-muted-foreground'
                    )}
                  >
                    <span className="text-xs">
                      {format(new Date(message.sent_at), 'HH:mm', {
                        locale: ptBR,
                      })}
                    </span>

                    {message.is_from_me && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 inline-flex items-center cursor-help">
                            {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin opacity-50" />}
                            {message.status === 'sent' && <Check className="h-3 w-3 opacity-70" />}
                            {message.status === 'delivered' && <CheckCheck className="h-3 w-3 opacity-70" />}
                            {message.status === 'read' && <CheckCheck className="h-3 w-3 text-[#34B7F1]" />}
                            {message.status === 'failed' && <span className="text-destructive text-[10px]">✗</span>}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">
                            {message.status === 'sending' && 'Enviando...'}
                            {message.status === 'sent' && 'Enviado'}
                            {message.status === 'delivered' && 'Entregue'}
                            {message.status === 'read' && 'Lido'}
                            {message.status === 'failed' && 'Erro ao enviar'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t space-y-3 bg-card">
        {mediaPreview && (
          <div className="relative inline-block">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMedia}
            >
              <X className="h-3 w-3" />
            </Button>
            {mediaPreview.type === 'image' && (
              <div className="relative">
                <ImageIcon className="absolute top-2 left-2 h-4 w-4 text-white drop-shadow-lg" />
                <img
                  src={mediaPreview.url}
                  alt="Preview"
                  className="max-h-24 rounded-lg border"
                />
              </div>
            )}
            {mediaPreview.type === 'video' && (
              <div className="relative">
                <Video className="absolute top-2 left-2 h-4 w-4 text-white drop-shadow-lg" />
                <video
                  src={mediaPreview.url}
                  className="max-h-24 rounded-lg border"
                  controls
                />
              </div>
            )}
            {mediaPreview.type === 'audio' && (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted">
                <Volume2 className="h-4 w-4" />
                <audio src={mediaPreview.url} controls className="h-8" />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-end min-h-[40px]">
          <MediaInput
            onEmojiSelect={handleEmojiSelect}
            onMediaSelect={handleMediaSelect}
            disabled={sending}
          />
          <Textarea
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              // auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            className="flex-1 resize-none overflow-y-auto min-h-[40px] max-h-[160px] py-2"
          />
          <Button
            onClick={handleSend}
            disabled={sending || (!inputMessage.trim() && !mediaPreview)}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
