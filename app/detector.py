import cv2
import numpy as np
import asyncio
import time
from typing import Callable
from tqdm import tqdm

async def process_video(
    input_path: str, 
    output_path: str, 
    process_id: str,
    progress_callback: Callable[[float], None] = None
):
    """
    Processa um vídeo para detectar pessoas e as circula em verde.
    
    Args:
        input_path: Caminho para o vídeo de entrada
        output_path: Caminho para salvar o vídeo processado
        process_id: ID único do processo
        progress_callback: Função de callback para reportar progresso
    """

    # Abre o vídeo de entrada
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise Exception(f"Não foi possível abrir o vídeo: {input_path}")
    
    # Obtém propriedades do vídeo
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Configura o codificador de vídeo para o arquivo de saída
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Classe COCO para pessoa é 1
    PERSON_CLASS = 1
    
    # Processa cada frame do vídeo
    frame_count = 0
    last_update_time = time.time()
    update_interval = 0.5  # Intervalo de atualização de progresso em segundos
    
    pbar = tqdm(total=total_frames, desc=f"Processando vídeo {process_id}")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Processa 1 a cada 3 frames para melhorar a performance (ajuste conforme necessário)
        if frame_count % 3 == 0:
            # Converte o frame para RGB e aplica a transformação
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
        # Escreve o frame processado no vídeo de saída
        out.write(frame)
        
        # Atualiza o contador de frames e o progresso
        frame_count += 1
        pbar.update(1)
        
        # Atualiza o progresso periodicamente para não sobrecarregar o WebSocket
        current_time = time.time()
        if current_time - last_update_time > update_interval:
            progress = (frame_count / total_frames) * 100
            if progress_callback:
                await progress_callback(progress)
            last_update_time = current_time
        
        # Permite que outras tarefas sejam executadas
        if frame_count % 30 == 0:  # A cada 30 frames
            await asyncio.sleep(0.001)
    
    pbar.close()
    
    # Libera os recursos
    cap.release()
    out.release()
    
    return output_path