import axios, { AxiosInstance } from 'axios';
import { database } from '../database/database';

export class WhatsAppService {
  private api: AxiosInstance;
  private instanceName: string;

  constructor() {
    this.instanceName = process.env.INSTANCE_NAME || 'CRMWP';
    
    // Verificar se as variáveis estão configuradas
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    
    if (!apiUrl) {
      console.warn('⚠️  Evolution API URL não configurada. Configure EVOLUTION_API_URL no .env');
    } else {
      console.log('✅ Evolution API configurada:', apiUrl);
    }
    
    if (!apiKey) {
      console.warn('⚠️  Evolution API Key não configurada. Configure EVOLUTION_API_KEY no .env');
    } else {
      console.log('🔑 API Key configurada:', apiKey.substring(0, 8) + '...');
    }
    
    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Criar instância
  async createInstance(): Promise<any> {
    try {
      const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
      
      const payload = {
        instanceName: this.instanceName,
        token: this.instanceName + '_token',
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhookUrl: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          "APPLICATION_STARTUP",
          "QRCODE_UPDATED", 
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "SEND_MESSAGE",
          "CONTACTS_SET",
          "CONTACTS_UPSERT"
        ]
      };

      console.log('📱 Criando instância com payload:', JSON.stringify(payload, null, 2));
      
      const response = await this.api.post('/instance/create', payload);

      console.log('✅ Instância criada:', response.data);
      await database.setSetting('instance_status', 'created');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message || 'Erro desconhecido');
    }
  }

  // Obter QR Code
  async getQRCode(): Promise<string> {
    try {
      const response = await this.api.get(`/instance/connect/${this.instanceName}`);
      const qrCode = response.data.base64 || response.data.qrcode;
      
      if (qrCode) {
        await database.setSetting('instance_qr', qrCode);
        await database.setSetting('instance_status', 'qr_ready');
      }
      
      return qrCode;
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verificar status da instância
  async getInstanceStatus(): Promise<any> {
    try {
      // Verificar se API está configurada
      if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
        return { 
          status: 'disconnected', 
          error: 'Evolution API não configurada',
          instance: { instanceName: this.instanceName }
        };
      }

      const response = await this.api.get(`/instance/connectionState/${this.instanceName}`);
      const status = response.data.instance?.state || 'disconnected';
      
      await database.setSetting('instance_status', status);
      return {
        status,
        instance: response.data.instance
      };
    } catch (error: any) {
      console.error('Erro ao verificar status:', error.response?.data || error.message);
      
      // Retornar status padrão se API não estiver configurada
      return { 
        status: 'disconnected', 
        error: 'Erro de conexão com Evolution API',
        instance: { instanceName: this.instanceName }
      };
    }
  }

  // Enviar mensagem
  async sendMessage(to: string, message: string, type: string = 'text'): Promise<any> {
    try {
      const cleanPhone = to.replace(/\D/g, '');
      const phoneNumber = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

      let payload: any = {
        number: phoneNumber
      };

      if (type === 'text') {
        payload.textMessage = { text: message };
      }

      const response = await this.api.post(`/message/sendText/${this.instanceName}`, payload);
      
      // Salvar mensagem enviada no banco
      const contactId = await database.createOrUpdateContact(cleanPhone);
      await database.createMessage({
        contactId,
        messageId: response.data.key?.id || `sent_${Date.now()}`,
        content: message,
        type,
        fromMe: true,
        timestamp: new Date()
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  // Buscar contatos
  async fetchContacts(): Promise<any[]> {
    try {
      const response = await this.api.get(`/chat/findContacts/${this.instanceName}`);
      
      // Sincronizar com banco local
      if (response.data && Array.isArray(response.data)) {
        for (const contact of response.data) {
          await database.createOrUpdateContact(
            contact.id?.replace('@s.whatsapp.net', '') || contact.phone,
            contact.name || contact.pushName,
            contact.profilePictureUrl
          );
        }
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar contatos:', error.response?.data || error.message);
      return [];
    }
  }

  // Processar webhook
  async processWebhook(data: any): Promise<void> {
    try {
      console.log('Webhook recebido:', JSON.stringify(data, null, 2));

      // Atualizar status da instância
      if (data.event === 'CONNECTION_UPDATE') {
        await database.setSetting('instance_status', data.data?.state || 'unknown');
      }

      // Processar QR Code
      if (data.event === 'QRCODE_UPDATED') {
        await database.setSetting('instance_qr', data.data?.qrcode || '');
      }

      // Processar mensagens
      if (data.event === 'MESSAGES_UPSERT' && data.data?.messages) {
        for (const message of data.data.messages) {
          await this.processMessage(message);
        }
      }

      // Processar contatos
      if (data.event === 'CONTACTS_UPSERT' && data.data?.contacts) {
        for (const contact of data.data.contacts) {
          await database.createOrUpdateContact(
            contact.id?.replace('@s.whatsapp.net', '') || contact.phone,
            contact.name || contact.pushName,
            contact.profilePictureUrl
          );
        }
      }

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
    }
  }

  private async processMessage(messageData: any): Promise<void> {
    try {
      const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '');
      if (!phone) return;

      // Criar/atualizar contato
      const contactId = await database.createOrUpdateContact(phone);

      // Extrair conteúdo da mensagem
      let content = '';
      let type = 'text';
      let mediaUrl = '';

      if (messageData.message?.conversation) {
        content = messageData.message.conversation;
      } else if (messageData.message?.extendedTextMessage?.text) {
        content = messageData.message.extendedTextMessage.text;
      } else if (messageData.message?.imageMessage) {
        content = messageData.message.imageMessage.caption || '[Imagem]';
        type = 'image';
        mediaUrl = messageData.message.imageMessage.url || '';
      } else if (messageData.message?.audioMessage) {
        content = '[Áudio]';
        type = 'audio';
        mediaUrl = messageData.message.audioMessage.url || '';
      } else if (messageData.message?.videoMessage) {
        content = messageData.message.videoMessage.caption || '[Vídeo]';
        type = 'video';
        mediaUrl = messageData.message.videoMessage.url || '';
      } else if (messageData.message?.documentMessage) {
        content = `[Documento: ${messageData.message.documentMessage.fileName || 'arquivo'}]`;
        type = 'document';
        mediaUrl = messageData.message.documentMessage.url || '';
      }

      if (content) {
        await database.createMessage({
          contactId,
          messageId: messageData.key?.id || `received_${Date.now()}`,
          content,
          type,
          fromMe: messageData.key?.fromMe || false,
          timestamp: new Date(messageData.messageTimestamp * 1000),
          mediaUrl
        });
      }

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }
}

export const whatsappService = new WhatsAppService(); 