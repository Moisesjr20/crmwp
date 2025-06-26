# CRMWP - WhatsApp CRM System

Sistema CRM para WhatsApp simples e eficiente, otimizado para deploy no EasyPanel.

## 🚀 Características

- ✅ **Aplicação única** Node.js + Express
- ✅ **Interface web integrada** responsiva e moderna
- ✅ **API REST completa** para integração
- ✅ **Banco SQLite** leve e confiável
- ✅ **Integration Evolution API** estável
- ✅ **Deploy fácil** no EasyPanel
- ✅ **Webhook automático** para espelhar mensagens

## 📋 Funcionalidades

### Interface Web
- Dashboard com status da conexão
- Envio de mensagens rápidas
- Visualização de mensagens recentes
- Gerenciamento de contatos
- Configurações da Evolution API

### API REST
- `GET /api/messages` - Listar mensagens
- `POST /api/messages/send` - Enviar mensagem
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts/sync` - Sincronizar contatos
- `GET /api/instance/status` - Status da instância
- `POST /api/instance/create` - Criar instância
- `GET /api/instance/qr` - Obter QR Code

## 🛠️ Instalação

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Editar variáveis de ambiente
nano .env

# Executar em modo desenvolvimento
npm run dev
```

### Deploy no EasyPanel

1. **Criar novo projeto** no EasyPanel
2. **Configurar variáveis de ambiente:**
   ```
   EVOLUTION_API_URL=https://sua-evolution-api.com
   EVOLUTION_API_KEY=sua-chave-aqui
   INSTANCE_NAME=CRMWP
   WEBHOOK_URL=https://seu-app.easypanel.host/webhook
   ```
3. **Deploy** via Docker ou Git

### Docker

```bash
# Build da imagem
docker build -t crmwp .

# Executar container
docker run -d \
  --name crmwp \
  -p 3000:3000 \
  -e EVOLUTION_API_URL=https://sua-evolution-api.com \
  -e EVOLUTION_API_KEY=sua-chave \
  -e WEBHOOK_URL=https://seu-app.host/webhook \
  -v crmwp-data:/app/data \
  crmwp
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3000` |
| `EVOLUTION_API_URL` | URL da Evolution API | *obrigatório* |
| `EVOLUTION_API_KEY` | Chave da Evolution API | *obrigatório* |
| `INSTANCE_NAME` | Nome da instância | `CRMWP` |
| `WEBHOOK_URL` | URL do webhook | *obrigatório* |
| `DATABASE_PATH` | Caminho do banco SQLite | `/app/data/crmwp.db` |

### Evolution API
Configure sua Evolution API seguindo a [documentação oficial](https://doc.evolution-api.com/).

## 🔄 Como Usar

### 1. Configurar Evolution API
- Configure `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
- Defina `WEBHOOK_URL` apontando para seu app

### 2. Criar Instância WhatsApp
- Acesse o dashboard
- Clique em "Criar Instância"
- Escaneie o QR Code com WhatsApp

### 3. Enviar Mensagens
- Via interface web: formulário de mensagem rápida
- Via API: `POST /api/messages/send`

### 4. Receber Mensagens
- Mensagens são automaticamente espelhadas via webhook
- Visualize no dashboard ou via API `GET /api/messages`

## 📡 Exemplos de API

### Enviar Mensagem
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }'
```

### Listar Mensagens
```bash
curl http://localhost:3000/api/messages?limit=10
```

### Verificar Status
```bash
curl http://localhost:3000/api/instance/status
```

## 🗂️ Estrutura do Projeto

```
crmwp/
├── src/
│   ├── database/
│   │   └── database.ts      # Gerenciador SQLite
│   ├── services/
│   │   └── whatsapp.ts      # Serviço WhatsApp
│   ├── routes/
│   │   └── api.ts           # Rotas da API
│   └── server.ts            # Servidor principal
├── public/
│   ├── index.html           # Interface web
│   └── js/
│       └── app.js           # JavaScript do frontend
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 🔒 Segurança

- Use HTTPS em produção
- Mantenha `EVOLUTION_API_KEY` segura
- Configure firewall apropriado
- Monitore logs regularmente

## 🐛 Troubleshooting

### Problemas Comuns

**❌ Erro de conexão com Evolution API**
- Verifique `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
- Teste acesso direto à Evolution API

**❌ Webhook não funciona**
- Verifique se `WEBHOOK_URL` está acessível
- Confirme configuração na Evolution API

**❌ QR Code não aparece**
- Aguarde alguns segundos após criar instância
- Clique em "Obter QR Code"
- Verifique logs do servidor

### Logs
```bash
# Ver logs do container
docker logs crmwp

# Logs em tempo real
docker logs -f crmwp
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: suporte@crmwp.com
- 💻 GitHub Issues: [Reportar problema](https://github.com/seu-usuario/crmwp/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/crmwp/wiki)

---

**CRMWP** - Sistema CRM WhatsApp simples e eficiente para EasyPanel 🚀 