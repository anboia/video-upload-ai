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
    
    // Remove the generic click listener from uploadContainer to avoid conflicts.
    // uploadContainer.addEventListener('click', function(e) { ... });

    // Add a specific click listener to the label within uploadContainer.
    const uploadLabel = uploadContainer.querySelector('.upload-label');
    if (uploadLabel) {
        uploadLabel.addEventListener('click', function() {
            // Since the 'for' attribute was removed from the label in HTML,
            // we no longer need to preventDefault() or stopPropagation() here
            // for the purpose of avoiding double dialogs.
            // Simply click the hidden file input.
            fileInput.click();
        });
    } else {
        // Fallback: if the label isn't found, log an error.
        // Clicks might not work as expected. This shouldn't happen with the current HTML.
        console.error('.upload-label not found within #upload-container. File selection might be broken.');
        // As a less ideal fallback, one could re-add a listener to uploadContainer,
        // but the primary approach is to use the label.
    }
    
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
                console.log('Processed video URL:', data.download_url); // Log para depuração

                // Listener para erros no carregamento/decodificação do vídeo
                processedVideo.addEventListener('error', function(e) {
                    console.error('Erro ao carregar o vídeo:', e);
                    let errorDetail = "Verifique o console para detalhes técnicos.";
                    if (processedVideo.error) {
                        switch (processedVideo.error.code) {
                            case MediaError.MEDIA_ERR_ABORTED:
                                errorDetail = "Download do vídeo abortado.";
                                break;
                            case MediaError.MEDIA_ERR_NETWORK:
                                errorDetail = "Erro de rede durante o download do vídeo.";
                                break;
                            case MediaError.MEDIA_ERR_DECODE:
                                errorDetail = "Erro ao decodificar o vídeo. Formato pode não ser suportado ou arquivo corrompido.";
                                break;
                            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                errorDetail = "Fonte do vídeo não suportada ou formato inválido.";
                                break;
                            default:
                                errorDetail = "Ocorreu um erro desconhecido ao carregar o vídeo.";
                        }
                    }
                    showNotification(`Erro ao carregar o vídeo. ${errorDetail}`, true);
                }, { once: true });
                
                processedVideo.addEventListener('loadeddata', function() {
                    processedVideo.muted = true; // Garante que o vídeo está mudo antes de tentar o play
                    const playPromise = processedVideo.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Vídeo pronto para reprodução ou autoplay iniciado via loadeddata.');
                        }).catch(error => {
                            console.warn('Autoplay (via loadeddata) foi impedido ou ocorreu um erro:', error);
                            showNotification('Vídeo carregado. Clique no play para assistir.', false);
                        });
                    }
                }, { once: true });

                // Inicia o carregamento do vídeo. Isso irá disparar o evento 'loadeddata' ou 'error'.
                processedVideo.load();
                
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
});
