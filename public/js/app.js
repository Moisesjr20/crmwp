// CRMWP - JavaScript Principal
class CRMWP {
    constructor() {
        this.apiUrl = '/api';
        this.init();
    }

    async init() {
        await this.loadStatus();
        await this.loadStats();
        this.setupEventListeners();
        this.startAutoRefresh();
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
                this.showError('Erro ao carregar status: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao carregar status:', error);
            this.showError('Erro de conexão');
        }
    }

    // Atualizar interface do status
    updateStatusUI(data) {
        const statusElement = document.getElementById('connection-status');
        const instanceElement = document.getElementById('instance-name');
        const qrSection = document.getElementById('qr-section');
        const qrCode = document.getElementById('qr-code');

        if (statusElement) {
            const status = data.status || 'disconnected';
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `px-2 py-1 rounded text-sm ${this.getStatusColor(status)}`;
        }

        if (instanceElement) {
            instanceElement.textContent = data.instance?.instanceName || 'CRMWP';
        }

        // Mostrar QR Code se necessário
        if (data.qrCode && (data.status === 'qr_ready' || data.status === 'connecting')) {
            qrSection?.classList.remove('hidden');
            if (qrCode) {
                qrCode.src = `data:image/png;base64,${data.qrCode}`;
                qrCode.classList.remove('hidden');
                document.getElementById('qr-loading')?.classList.add('hidden');
            }
        } else {
            qrSection?.classList.add('hidden');
        }
    }

    // Criar instância
    async createInstance() {
        try {
            this.showLoading('Criando instância...');
            const response = await fetch(`${this.apiUrl}/instance/create`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Instância criada com sucesso!');
                await this.loadStatus();
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Erro ao criar instância:', error);
            this.showError('Erro ao criar instância');
        } finally {
            this.hideLoading();
        }
    }

    // Obter QR Code
    async getQRCode() {
        try {
            this.showLoading('Obtendo QR Code...');
            const response = await fetch(`${this.apiUrl}/instance/qr`);
            const data = await response.json();
            
            if (data.success && data.data.qrCode) {
                this.showSuccess('QR Code gerado!');
                await this.loadStatus();
            } else {
                this.showError(data.message || 'Nenhum QR Code disponível');
            }
        } catch (error) {
            console.error('Erro ao obter QR Code:', error);
            this.showError('Erro ao obter QR Code');
        } finally {
            this.hideLoading();
        }
    }

    // Enviar mensagem rápida
    async sendQuickMessage(event) {
        event.preventDefault();
        
        const phone = document.getElementById('quick-phone')?.value;
        const message = document.getElementById('quick-message')?.value;
        
        if (!phone || !message) {
            this.showError('Preencha todos os campos');
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
                this.showSuccess('Mensagem enviada com sucesso!');
                document.getElementById('quick-message-form')?.reset();
                await this.loadStats();
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showError('Erro ao enviar mensagem');
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
                <div class="text-gray-500 text-center py-4">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>Nenhuma mensagem ainda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.slice(0, 5).map(msg => `
            <div class="flex items-start space-x-3 p-3 border-l-4 border-gray-200 hover:bg-gray-50">
                <div class="flex-shrink-0">
                    <i class="fas fa-${msg.from_me ? 'paper-plane text-blue-500' : 'inbox text-green-500'}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            ${msg.contact_name || msg.contact_phone || 'Contato'}
                        </p>
                        <p class="text-xs text-gray-500">
                            ${this.formatDate(msg.timestamp)}
                        </p>
                    </div>
                    <p class="text-sm text-gray-600 truncate">
                        ${msg.content}
                    </p>
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
            'error': 'Erro'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'connected': 'bg-green-200 text-green-800',
            'connecting': 'bg-yellow-200 text-yellow-800',
            'disconnected': 'bg-red-200 text-red-800',
            'qr_ready': 'bg-blue-200 text-blue-800',
            'created': 'bg-purple-200 text-purple-800',
            'error': 'bg-red-200 text-red-800'
        };
        return colorMap[status] || 'bg-gray-200 text-gray-800';
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
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showLoading(message) {
        // Implementar loading toast se necessário
        console.log('Loading:', message);
    }

    hideLoading() {
        // Implementar hide loading se necessário
    }

    showNotification(message, type) {
        // Criar toast notification
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        
        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new CRMWP();
}); 