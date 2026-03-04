
// Helpers for evolution-webhook: keyword detection, CORS, message extraction, etc.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function detectKeywords(messageContent: string, keywords: string[]): boolean {
  const lowerMessage = messageContent.toLowerCase();
  return keywords.some(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  );
}

export interface MessageData {
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mimeType?: string;
  fileName?: string;
}

export function getMessageContent(message: any): MessageData {
  const msg = message.message;
  if (!msg) return { text: 'Mensagem recebida' };

  // Texto simples
  if (msg.conversation) return { text: msg.conversation };

  // Texto estendido
  if (msg.extendedTextMessage) return { text: msg.extendedTextMessage.text || '' };

  // Imagem
  if (msg.imageMessage) {
    return {
      text: msg.imageMessage.caption || '[Imagem]',
      mediaUrl: msg.imageMessage.url,
      mediaType: 'image',
      mimeType: msg.imageMessage.mimetype,
      fileName: 'image.jpg'
    };
  }

  // Vídeo
  if (msg.videoMessage) {
    return {
      text: msg.videoMessage.caption || '[Vídeo]',
      mediaUrl: msg.videoMessage.url,
      mediaType: 'video',
      mimeType: msg.videoMessage.mimetype,
      fileName: 'video.mp4'
    };
  }

  // Áudio
  if (msg.audioMessage) {
    return {
      text: '[Áudio]',
      mediaUrl: msg.audioMessage.url,
      mediaType: 'audio',
      mimeType: msg.audioMessage.mimetype,
      fileName: 'audio.ogg'
    };
  }

  // Documento
  if (msg.documentMessage) {
    return {
      text: msg.documentMessage.title || msg.documentMessage.fileName || '[Documento]',
      mediaUrl: msg.documentMessage.url,
      mediaType: 'document',
      mimeType: msg.documentMessage.mimetype,
      fileName: msg.documentMessage.fileName || 'document'
    };
  }

  // Fallback para outros tipos (ex: botões, listas)
  return { text: 'Tipo de mensagem não suportado' };
}

export function getContactName(message: any): string {
  return message.pushName || "Lead Via WhatsApp";
}

export function getProfilePictureUrl(message: any): string | null {
  // A Evolution API retorna a foto do perfil em message.key.participant ou precisamos buscar
  // Por enquanto, retornar null e capturar em uma função separada
  return message.profilePictureUrl || null;
}
