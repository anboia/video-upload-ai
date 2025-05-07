# Detector de Pessoas em Vídeo

Esta é uma aplicação web que utiliza FastAPI e PyTorch para processar vídeos, detectar pessoas e circulá-las em verde. O sistema é composto por um backend Python que realiza o processamento de vídeo usando IA e um frontend em HTML, CSS e JavaScript vanilla.

## Características

- Upload de vídeos através de interface amigável com drag & drop
- Processamento assíncrono de vídeos no servidor
- Detecção de pessoas usando o modelo Faster R-CNN com ResNet-50 do PyTorch
- Rastreamento em tempo real do progresso de processamento via WebSockets
- Visualização e download do vídeo processado
- Interface responsiva para todos os dispositivos

## Requisitos do Sistema

- Python 3.8+
- PyTorch 2.0+
- CUDA (opcional, mas recomendado para processamento acelerado por GPU)
- Aproximadamente 4GB de RAM (mais para vídeos maiores)
- Espaço em disco para armazenar vídeos originais e processados

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/detector-pessoas-video.git
   cd detector-pessoas-video
   ```

2. Crie um ambiente virtual e ative-o:
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

## Execução

Execute o servidor FastAPI com o Uvicorn:

```bash
python -m app.main
```

Ou alternativamente:

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Acesse a aplicação no navegador através do endereço: http://localhost:8000

## Como Usar

1. Acesse a aplicação no navegador
2. Arraste e solte um arquivo de vídeo ou clique para selecionar um
3. Clique em "Processar Vídeo" para iniciar o processamento
4. Acompanhe o progresso do processamento na barra de progresso
5. Quando o processamento for concluído, você poderá visualizar o vídeo processado
6. Use o botão "Baixar Vídeo Processado" para salvar o vídeo em seu dispositivo

## Estrutura do Projeto

```
video-detection-app/
├── app/
│   ├── __init__.py
│   ├── main.py             # Servidor FastAPI
│   ├── detector.py         # Lógica de detecção de pessoas
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css  # Estilos da aplicação
│   │   ├── js/
│   │   │   └── script.js   # Lógica do cliente
│   │   └── uploads/        # Diretório para armazenar os vídeos
│   └── templates/
│       └── index.html      # Interface do usuário
├── requirements.txt        # Dependências do projeto
└── README.md               # Documentação
```

## Detalhes Técnicos

- **FastAPI**: Framework web de alta performance para APIs com Python
- **PyTorch**: Biblioteca de aprendizado de máquina para detecção de objetos
- **WebSockets**: Comunicação em tempo real entre cliente e servidor
- **Processamento Assíncrono**: Operações de I/O e processamento não bloqueantes
- **Faster R-CNN**: Modelo de detecção de objetos pré-treinado no conjunto de dados COCO

## Limitações

- O tempo de processamento depende do tamanho do vídeo e do hardware disponível
- Para melhorar a performance, a detecção é realizada a cada 3 frames por padrão
- Vídeos muito grandes podem levar a um consumo significativo de memória

## Melhorias Futuras

- Adição de opções de configuração para ajustar a sensibilidade da detecção
- Implementação de rastreamento de objetos para melhorar a eficiência
- Suporte a diferentes tipos de objetos além de pessoas
- Integração com serviços de armazenamento em nuvem
- Adição de autenticação para proteger os vídeos processados

## Licença

MIT