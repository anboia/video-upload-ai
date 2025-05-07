import os
import uuid
import shutil
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request
import uvicorn
import asyncio
from typing import List

from .detector import process_video

app = FastAPI()

# Montar pastas estáticas
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Criar pasta de uploads se não existir
os.makedirs("app/static/uploads", exist_ok=True)

# Classe para gerenciar conexões de WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):
    # Gerar um ID único para o processamento
    process_id = str(uuid.uuid4())
    
    # Criar pasta para o arquivo
    process_dir = f"app/static/uploads/{process_id}"
    os.makedirs(process_dir, exist_ok=True)
    
    # Salvar arquivo de vídeo original
    file_path = f"{process_dir}/original.mp4"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Iniciar processamento assíncrono
    asyncio.create_task(process_video_task(file_path, process_id))
    
    return {"process_id": process_id, "message": "Processamento iniciado"}

async def process_video_task(file_path: str, process_id: str):
    """Tarefa assíncrona para processar o vídeo e notificar o progresso"""
    output_path = f"app/static/uploads/{process_id}/processed.mp4"
    
    try:
        # Chama a função de processamento de vídeo
        # Esta função enviará atualizações de progresso através do callback
        await process_video(
            file_path, 
            output_path, 
            process_id,
            progress_callback=lambda progress: asyncio.create_task(
                manager.broadcast(f"{{'process_id': '{process_id}', 'progress': {progress}}}")
            )
        )
        
        # Notifica conclusão do processamento
        download_url = f"/static/uploads/{process_id}/processed.mp4"
        await manager.broadcast(
            f"{{'process_id': '{process_id}', 'progress': 100, 'status': 'completed', 'download_url': '{download_url}'}}"
        )
    except Exception as e:
        # Notifica erro no processamento
        await manager.broadcast(
            f"{{'process_id': '{process_id}', 'status': 'error', 'message': '{str(e)}'}}"
        )

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Aqui você pode processar mensagens do cliente se necessário
            await manager.send_personal_message(f"Você enviou: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)