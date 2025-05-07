document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const uploadContainer = document.getElementById('upload-container');
    const fileInput = document.getElementById('video-upload');
    const selectedFileContainer = document.getElementById('selected-file-container');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const uploadBtn = document.getElementById('upload-btn');
    const processingSection = document.getElementById('processing-section');
    const resultSection = document.getElementById('result-section');
    const progressBar = document.getElementById('progress');
    const progressPercentage = document.getElementById('progress-percentage');
    const processedVideo = document.getElementById('processed-video');
    const downloadLink = document.getElementById('download-link');
    const newUploadBtn = document.getElementById('new-upload-btn');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    
    // Variáveis globais
    let selectedFile = null;
    let processId = null;
    let websocket = null;
    
    // Inicializa o WebSocket
    function initWebSocket() {
        const clientId = Date.now().toString();
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/${clientId}`;
        
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = function(event) {
            console.log('WebSocket conectado');
        }
    
    // Eventos de Upload e Drag & Drop
    fileInput.addEventListener('change', handleFileSelection);
    
    uploadContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.add('drag-over');
    });
    
    uploadContainer.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.remove('drag-over');
    });
    
    uploadContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection({ target: { files: e.dataTransfer.files } });
        }
    });
    
    uploadContainer.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Função para lidar com a seleção de arquivo
    function handleFileSelection(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Verifica se é um arquivo de vídeo
            if (!file.type.startsWith('video/')) {
                showNotification('Por favor, selecione um arquivo de vídeo válido.', true);
                return;
            }
            
            // Armazena o arquivo selecionado
            selectedFile = file;
            
            // Atualiza a interface
            uploadContainer.style.display = 'none';
            selectedFileContainer.style.display = 'flex';
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
        }
    }
    
    // Eventos de botões
    uploadBtn.addEventListener('click', startProcessing);
    
    newUploadBtn.addEventListener('click', function() {
        // Reseta a interface para o estado inicial
        resultSection.style.display = 'none';
        selectedFileContainer.style.display = 'none';
        uploadContainer.style.display = 'block';
        processedVideo.src = '';
        
        // Limpa o input de arquivo
        fileInput.value = '';
        selectedFile = null;
    });
    
    notificationClose.addEventListener('click', hideNotification);
    
    // Função para iniciar o processamento
    function startProcessing() {
        if (!selectedFile) {
            showNotification('Nenhum arquivo selecionado.', true);
            return;
        }
        
        // Cria um objeto FormData para enviar o arquivo
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Atualiza a interface
        selectedFileContainer.style.display = 'none';
        processingSection.style.display = 'block';
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0';
        
        // Envia o arquivo para o servidor
        fetch('/upload/', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar o arquivo.');
            }
            return response.json();
        })
        .then(data => {
            // Armazena o ID do processo para acompanhar o progresso
            processId = data.process_id;
            showNotification('Arquivo enviado com sucesso. Processamento iniciado.');
        })
        .catch(error => {
            showNotification(`Erro: ${error.message}`, true);
            processingSection.style.display = 'none';
            selectedFileContainer.style.display = 'flex';
        });
    };
        
        websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                // Ignora mensagens de eco
                if (data.process_id) {
                    handleProgressUpdate(data);
                }
            } catch (error) {
                console.log('Mensagem recebida:', event.data);
            }
        };
        
        websocket.onclose = function(event) {
            console.log('WebSocket desconectado');
            // Tenta reconectar após 3 segundos
            setTimeout(initWebSocket, 3000);
        };
        
        websocket.onerror = function(error) {
            console.error('Erro no WebSocket:', error);
        };
    }
    
    // Inicia a conexão WebSocket
    initWebSocket();
    
    // Função para formatar o tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Função para mostrar notificação
    function showNotification(message, isError = false) {
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        const notificationContent = notification.querySelector('.notification-content');
        if (isError) {
            notificationContent.classList.add('error');
        } else {
            notificationContent.classList.remove('error');
        }
        
        // Esconde a notificação após 5 segundos
        setTimeout(() => {
            hideNotification();
        }, 5000);
    }
    
    // Função para esconder notificação
    function hideNotification() {
        notification.classList.remove('show');
    }
    
    // Função para lidar com atualizações de progresso
    function handleProgressUpdate(data) {
        // Verifica se é para o processo atual
        if (processId && data.process_id === processId) {
            // Atualiza a barra de progresso
            const progress = Math.round(data.progress);
            progressBar.style.width = `${progress}%`;
            progressPercentage.textContent = progress;
            
            // Verifica se o processamento foi concluído
            if (data.status === 'completed' && data.download_url) {
                // Atualiza a interface para mostrar o resultado
                processingSection.style.display = 'none';
                resultSection.style.display = 'block';
                
                // Define o vídeo processado e o link de download
                processedVideo.src = data.download_url;
                downloadLink.href = data.download_url;
                
                // Mostra notificação de conclusão
                showNotification('Processamento concluído com sucesso!');
            }
            
            // Verifica se ocorreu um erro
            if (data.status === 'error') {
                showNotification(`Erro no processamento: ${data.message}`, true);
                processingSection.style.display = 'none';
                uploadContainer.style.display = 'block';
            }
        }
    }
})