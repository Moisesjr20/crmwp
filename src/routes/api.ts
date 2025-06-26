import express from 'express';
import { database } from '../database/database';
import { whatsappService } from '../services/whatsapp';

const router = express.Router();

// GET /api/instance/test - Testar conexão com Evolution API
router.get('/instance/test', async (req, res) => {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    
    if (!apiUrl || !apiKey) {
      return res.json({
        success: false,
        message: 'Evolution API não configurada',
        configured: false,
        missing: {
          url: !apiUrl,
          key: !apiKey
        }
      });
    }
    
    // Testar conexão
    const axios = require('axios');
    const response = await axios.get(apiUrl, {
      headers: { 'apikey': apiKey },
      timeout: 10000
    });
    
    res.json({
      success: true,
      message: 'Conexão com Evolution API estabelecida',
      configured: true,
      data: {
        version: response.data.version,
        clientName: response.data.clientName,
        manager: response.data.manager,
        api: apiUrl
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      message: 'Erro ao conectar com Evolution API: ' + (error.response?.data?.message || error.message),
      configured: true,
      error: error.response?.status || 'CONNECTION_ERROR'
    });
  }
});

// GET /api/messages - Listar mensagens
router.get('/messages', async (req, res) => {
  try {
    const { contact_id, limit } = req.query;
    const messages = await database.getMessages(
      contact_id as string,
      parseInt(limit as string) || 50
    );
    
    res.json({
      success: true,
      data: messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/messages/send - Enviar mensagem
router.post('/messages/send', async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Telefone e mensagem são obrigatórios'
      });
    }

    const result = await whatsappService.sendMessage(to, message, type);
    
    res.json({
      success: true,
      data: result,
      message: 'Mensagem enviada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/contacts - Listar contatos
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await database.getContacts();
    
    res.json({
      success: true,
      data: contacts,
      total: contacts.length
    });
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/contacts/sync - Sincronizar contatos
router.post('/contacts/sync', async (req, res) => {
  try {
    const contacts = await whatsappService.fetchContacts();
    
    res.json({
      success: true,
      data: contacts,
      total: contacts.length,
      message: 'Contatos sincronizados com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar contatos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/instance/status - Status da instância
router.get('/instance/status', async (req, res) => {
  try {
    const status = await whatsappService.getInstanceStatus();
    const qrCode = await database.getSetting('instance_qr');
    
    res.json({
      success: true,
      data: {
        ...status,
        qrCode
      }
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// POST /api/instance/create - Criar instância
router.post('/instance/create', async (req, res) => {
  try {
    const result = await whatsappService.createInstance();
    
    res.json({
      success: true,
      data: result,
      message: 'Instância criada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/instance/qr - Obter QR Code
router.get('/instance/qr', async (req, res) => {
  try {
    const qrCode = await whatsappService.getQRCode();
    
    res.json({
      success: true,
      data: { qrCode },
      message: qrCode ? 'QR Code gerado' : 'Nenhum QR Code disponível'
    });
  } catch (error: any) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

export default router; 