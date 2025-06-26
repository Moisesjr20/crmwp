#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CRMWP - Servidor Local de Desenvolvimento\n');

// Verificar se .env.local existe
const envLocalPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envLocalPath)) {
    console.log('❌ Arquivo .env.local não encontrado!');
    console.log('📝 Criando .env.local com configurações padrão...\n');
    
    const envContent = `# CRMWP - Configuração Local de Desenvolvimento
NODE_ENV=development
PORT=3000

# Evolution API Settings (Configure com seus dados reais)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api

# Instance Settings
INSTANCE_NAME=CRMWP-DEV
WEBHOOK_URL=http://localhost:3000/webhook

# Database Local
DATABASE_PATH=./data/crmwp-dev.db

# Security (Para desenvolvimento)
JWT_SECRET=desenvolvimento-local-jwt-secret-123456789

# Debug
DEBUG=true
LOG_LEVEL=debug`;

    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Arquivo .env.local criado com sucesso!');
    console.log('📝 Edite o arquivo .env.local com suas configurações da Evolution API\n');
}

// Verificar se diretório data existe
const dataPath = path.join(__dirname, '../data');
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
    console.log('✅ Diretório data/ criado\n');
}

// Menu de opções
console.log('🎛️  Escolha uma opção:\n');
console.log('1. 🟢 Servidor Node.js (desenvolvimento)');
console.log('2. 🐳 Docker (ambiente idêntico à produção)');
console.log('3. 🌐 Servidor com Ngrok (webhook público)');
console.log('4. 🗄️  Interface SQLite (visualizar banco)');
console.log('5. 🔧 Configurar Evolution API');

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
        const choice = chunk.trim();
        handleChoice(choice);
    }
});

function handleChoice(choice) {
    switch(choice) {
        case '1':
            startNodeServer();
            break;
        case '2':
            startDockerServer();
            break;
        case '3':
            startNgrokServer();
            break;
        case '4':
            openSQLiteInterface();
            break;
        case '5':
            configureEvolutionAPI();
            break;
        default:
            console.log('❌ Opção inválida. Escolha 1, 2, 3, 4 ou 5.');
            process.exit(1);
    }
}

function startNodeServer() {
    console.log('🟢 Iniciando servidor Node.js...\n');
    
    // Usar .env.local se existir
    const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
    
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
    });

    console.log('📱 Interface: http://localhost:3000');
    console.log('🔗 API: http://localhost:3000/api');
    console.log('📞 Health: http://localhost:3000/health');
    console.log('🗄️  SQLite: ./data/crmwp-dev.db\n');
    console.log('⚡ Pressione Ctrl+C para parar o servidor\n');
}

function startDockerServer() {
    console.log('🐳 Iniciando servidor Docker...\n');
    
    const docker = spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'up', '--build'], {
        stdio: 'inherit'
    });

    console.log('📱 Interface: http://localhost:3000');
    console.log('🗄️  SQLite Admin: http://localhost:8080');
    console.log('⚡ Pressione Ctrl+C para parar o servidor\n');
}

function startNgrokServer() {
    console.log('🌐 Iniciando servidor com Ngrok...\n');
    console.log('📝 Primeiro, instale o ngrok: npm install -g ngrok');
    console.log('🔑 Configure seu token: ngrok authtoken SEU_TOKEN');
    console.log('🚀 Execute: ngrok http 3000');
    console.log('📋 Use a URL gerada como WEBHOOK_URL na Evolution API\n');
    
    startNodeServer();
}

function openSQLiteInterface() {
    console.log('🗄️  Abrindo interface SQLite...\n');
    console.log('📝 Instale: npm install -g sqlite3');
    console.log('🔍 Visualize: sqlite3 ./data/crmwp-dev.db');
    console.log('📊 Ou use uma GUI como DB Browser for SQLite\n');
}

function configureEvolutionAPI() {
    console.log('🔧 Configuração da Evolution API:\n');
    console.log('1. 📋 Edite o arquivo .env.local');
    console.log('2. 🔑 Configure EVOLUTION_API_URL e EVOLUTION_API_KEY');
    console.log('3. 🌐 Configure WEBHOOK_URL com sua URL local ou ngrok');
    console.log('4. 🔄 Reinicie o servidor\n');
    
    console.log('📖 Exemplo de configuração:');
    console.log('EVOLUTION_API_URL=https://sua-evolution.com');
    console.log('EVOLUTION_API_KEY=sua_chave_aqui');
    console.log('WEBHOOK_URL=http://localhost:3000/webhook\n');
}

process.stdin.resume(); 