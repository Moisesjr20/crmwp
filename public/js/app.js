// CRMWP - JavaScript Principal
console.log('🚀 CRMWP JavaScript carregado com sucesso!');

class CRMWP {
    constructor() {
        this.apiUrl = '/api';
        this.refreshInterval = null;
        this.statusInterval = null;
        this.init();
        
        // Disponibilizar globalmente para outras funções
        window.crmwpApp = this;
    }

    async init() {
        // Mostrar loading inicial
        this.showInitialLoading();
        
        try {
            await this.loadStatus();
            await this.loadStats();
            this.setupEventListeners();
            this.startAutoRefresh();
            
            // Esconder loading e mostrar sucesso
            this.hideInitialLoading();
            this.showAlert('success', 'Sistema Iniciado', 'CRMWP carregado com sucesso!');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.hideInitialLoading();
            this.showAlert('error', 'Erro de Inicialização', 'Falha ao carregar o sistema. Verifique a conexão.');
        }
    }

    showInitialLoading() {
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span class="text-sm text-blue-600">Carregando sistema...</span>
                </div>
            `;
        }
    }

    hideInitialLoading() {
        // A função updateStatusUI irá atualizar o indicador adequadamente
    }

    // Event Listeners
    setupEventListeners() {
        // Botões do status
        document.getElementById('btn-create-instance')?.addEventListener('click', () => this.createInstance());
        document.getElementById('btn-get-qr')?.addEventListener('click', () => this.getQRCode());
        document.getElementById('btn-refresh')?.addEventListener('click', () => this.loadStatus());

        // Formulário de mensagem rápida
        document.getElementById('quick-message-form')?.addEventListener('submit', (e) => this.sendQuickMessage(e));
    }

    // Carregar status da instância
    async loadStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/instance/status`);
            const data = await response.json();
            
            if (data.success) {
                this.updateStatusUI(data.data);
            } else {
                this.showAlert('error', 'Erro de Status', 'Erro ao carregar status: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao carregar status:', error);
            this.showAlert('error', 'Erro de Conexão', 'Falha ao conectar com o servidor.');
        }
    }

    // Atualizar interface do status
    updateStatusUI(data) {
        const statusElement = document.getElementById('connection-status');
        const instanceElement = document.getElementById('instance-name');
        const statusIndicator = document.getElementById('status-indicator');
        const qrSection = document.getElementById('qr-section');
        const qrCode = document.getElementById('qr-code');
        const qrInstructions = document.getElementById('qr-instructions');

        if (statusElement) {
            const status = data.status || 'disconnected';
            statusElement.textContent = this.getStatusText(status);
        }

        if (instanceElement) {
            instanceElement.textContent = data.instance?.instanceName || 'CRMWP';
        }

        // Atualizar indicador de status
        if (statusIndicator) {
            const status = data.status || 'disconnected';
            const statusInfo = this.getStatusIndicator(status);
            statusIndicator.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 ${statusInfo.bgColor} rounded-full ${statusInfo.animation}"></div>
                    <span class="text-sm ${statusInfo.textColor}">${statusInfo.text}</span>
                </div>
            `;
        }

        // Mostrar QR Code se necessário
        if (data.qrCode && (data.status === 'qr_ready' || data.status === 'connecting')) {
            qrSection?.classList.remove('hidden');
            if (qrCode) {
                qrCode.src = `data:image/png;base64,${data.qrCode}`;
                qrCode.classList.remove('hidden');
                qrInstructions?.classList.remove('hidden');
                document.getElementById('qr-loading')?.classList.add('hidden');
            }
        } else {
            qrSection?.classList.add('hidden');
        }
    }

    // Criar instância
    async createInstance() {
        const button = document.getElementById('btn-create-instance');
        const originalText = button.innerHTML;
        
        try {
            // Atualizar botão para loading
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
            button.disabled = true;
            
            this.showAlert('info', 'Criando Instância', 'Aguarde enquanto criamos sua instância WhatsApp...');
            
            const response = await fetch(`${this.apiUrl}/instance/create`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('success', 'Instância Criada!', 'Sua instância foi criada com sucesso. Aguarde o QR Code aparecer.');
                await this.loadStatus();
            } else {
                this.showAlert('error', 'Erro ao Criar Instância', data.message || 'Falha desconhecida ao criar instância.');
            }
        } catch (error) {
            console.error('Erro ao criar instância:', error);
            this.showAlert('error', 'Erro de Conexão', 'Não foi possível conectar com o servidor. Verifique sua conexão.');
        } finally {
            // Restaurar botão
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // Obter QR Code
    async getQRCode() {
        const button = document.getElementById('btn-get-qr');
        const originalText = button.innerHTML;
        
        try {
            // Atualizar botão para loading
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Obtendo...';
            button.disabled = true;
            
            this.showAlert('info', 'Obtendo QR Code', 'Gerando QR Code para conexão...');
            
            const response = await fetch(`${this.apiUrl}/instance/qr`);
            const data = await response.json();
            
            if (data.success && data.data.qrCode) {
                this.showAlert('success', 'QR Code Gerado!', 'QR Code disponível. Escaneie com seu WhatsApp.');
                await this.loadStatus();
            } else {
                this.showAlert('warning', 'QR Code Indisponível', data.message || 'Nenhum QR Code disponível no momento.');
            }
        } catch (error) {
            console.error('Erro ao obter QR Code:', error);
            this.showAlert('error', 'Erro ao Obter QR Code', 'Falha ao gerar QR Code. Tente novamente.');
        } finally {
            // Restaurar botão
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // Enviar mensagem rápida
    async sendQuickMessage(event) {
        event.preventDefault();
        
        const phone = document.getElementById('quick-phone')?.value;
        const message = document.getElementById('quick-message')?.value;
        
        if (!phone || !message) {
            this.showAlert('warning', 'Campos Obrigatórios', 'Preencha o telefone e a mensagem.');
            return;
        }

        try {
            this.showLoading('Enviando mensagem...');
            const response = await fetch(`${this.apiUrl}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: phone,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('success', 'Mensagem Enviada!', 'Sua mensagem foi enviada com sucesso.');
                document.getElementById('quick-message-form')?.reset();
                await this.loadStats();
            } else {
                this.showAlert('error', 'Erro ao Enviar', data.message || 'Falha ao enviar mensagem.');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showAlert('error', 'Erro de Conexão', 'Não foi possível enviar a mensagem. Verifique sua conexão.');
        } finally {
            this.hideLoading();
        }
    }

    // Carregar estatísticas
    async loadStats() {
        try {
            // Carregar mensagens
            const messagesResponse = await fetch(`${this.apiUrl}/messages?limit=5`);
            const messagesData = await messagesResponse.json();
            
            if (messagesData.success) {
                this.updateMessagesStats(messagesData.data);
                this.updateRecentMessages(messagesData.data);
            }

            // Carregar contatos
            const contactsResponse = await fetch(`${this.apiUrl}/contacts`);
            const contactsData = await contactsResponse.json();
            
            if (contactsData.success) {
                this.updateContactsStats(contactsData.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Atualizar estatísticas de mensagens
    updateMessagesStats(messages) {
        const totalElement = document.getElementById('total-messages');
        if (totalElement) {
            totalElement.textContent = messages.length;
        }
    }

    // Atualizar estatísticas de contatos
    updateContactsStats(contacts) {
        const totalElement = document.getElementById('total-contacts');
        if (totalElement) {
            totalElement.textContent = contacts.length;
        }
    }

    // Atualizar mensagens recentes
    updateRecentMessages(messages) {
        const container = document.getElementById('recent-messages');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-gray-500 text-center py-8">
                    <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-inbox text-2xl text-gray-400"></i>
                    </div>
                    <p class="font-medium">Nenhuma mensagem ainda</p>
                    <p class="text-sm text-gray-400">Suas mensagens aparecerão aqui</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.slice(0, 5).map(msg => `
            <div class="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full ${msg.from_me ? 'bg-blue-100' : 'bg-green-100'} flex items-center justify-center">
                            <i class="fas fa-${msg.from_me ? 'paper-plane text-blue-600' : 'inbox text-green-600'}"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <p class="text-sm font-semibold text-gray-900 truncate">
                                ${msg.contact_name || msg.contact_phone || 'Contato'}
                            </p>
                            <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                ${this.formatDate(msg.timestamp)}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 truncate leading-relaxed">
                            ${this.truncateMessage(msg.content)}
                        </p>
                        <div class="flex items-center mt-2 space-x-2">
                            <span class="text-xs px-2 py-1 rounded-full ${this.getMessageTypeStyle(msg.type)}">
                                ${this.getMessageTypeText(msg.type)}
                            </span>
                            ${msg.from_me ? '<span class="text-xs text-blue-600"><i class="fas fa-check-double"></i></span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Auto refresh
    startAutoRefresh() {
        // Atualizar status a cada 30 segundos
        setInterval(() => {
            this.loadStatus();
        }, 30000);

        // Atualizar uptime
        const startTime = Date.now();
        setInterval(() => {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement) {
                uptimeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // Utility methods
    getStatusText(status) {
        const statusMap = {
            'connected': 'Conectado',
            'connecting': 'Conectando',
            'disconnected': 'Desconectado',
            'qr_ready': 'QR Code Pronto',
            'created': 'Instância Criada',
            'error': 'Erro de Conexão'
        };
        return statusMap[status] || status;
    }

    getStatusIndicator(status) {
        const indicators = {
            'connected': {
                bgColor: 'bg-green-500',
                textColor: 'text-green-600',
                text: 'Conectado e Ativo',
                animation: ''
            },
            'connecting': {
                bgColor: 'bg-yellow-500',
                textColor: 'text-yellow-600',
                text: 'Conectando...',
                animation: 'animate-pulse'
            },
            'disconnected': {
                bgColor: 'bg-red-500',
                textColor: 'text-red-600',
                text: 'Desconectado',
                animation: 'animate-pulse'
            },
            'qr_ready': {
                bgColor: 'bg-blue-500',
                textColor: 'text-blue-600',
                text: 'QR Code Disponível',
                animation: 'animate-pulse'
            },
            'created': {
                bgColor: 'bg-purple-500',
                textColor: 'text-purple-600',
                text: 'Instância Criada',
                animation: ''
            },
            'error': {
                bgColor: 'bg-red-500',
                textColor: 'text-red-600',
                text: 'Erro de Conexão',
                animation: 'animate-pulse'
            }
        };
        
        return indicators[status] || {
            bgColor: 'bg-gray-500',
            textColor: 'text-gray-600',
            text: 'Status Desconhecido',
            animation: ''
        };
    }

    truncateMessage(content, maxLength = 80) {
        if (!content) return '';
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }

    getMessageTypeStyle(type) {
        const styles = {
            'text': 'bg-gray-100 text-gray-700',
            'image': 'bg-blue-100 text-blue-700',
            'audio': 'bg-green-100 text-green-700',
            'video': 'bg-purple-100 text-purple-700',
            'document': 'bg-orange-100 text-orange-700'
        };
        return styles[type] || 'bg-gray-100 text-gray-700';
    }

    getMessageTypeText(type) {
        const types = {
            'text': 'Texto',
            'image': 'Imagem',
            'audio': 'Áudio',
            'video': 'Vídeo',
            'document': 'Documento'
        };
        return types[type] || 'Texto';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Notification methods
    showAlert(type, title, message) {
        // Usar a função global showAlert definida no HTML
        if (typeof window.showAlert === 'function') {
            window.showAlert(type, title, message);
        } else {
            // Fallback para console se função não existir
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    showLoading(message) {
        console.log('Loading:', message);
        // Implementar loading visual se necessário
    }

    hideLoading() {
        // Implementar hide loading se necessário
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new CRMWP();
}); 