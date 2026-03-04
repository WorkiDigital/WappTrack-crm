
interface WebhookData {
  campaign_id: string;
  campaign_name?: string;
  lead_name: string;
  lead_phone: string;
  timestamp: string;
  event_type?: string;
}

export const sendWebhookData = async (webhookUrl: string, data: WebhookData): Promise<void> => {
  try {
    console.log('Enviando dados para webhook:', webhookUrl, data);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    console.log('Dados enviados com sucesso para o webhook');
  } catch (error) {
    console.error('Erro ao enviar dados para webhook:', error);
    throw error;
  }
};
