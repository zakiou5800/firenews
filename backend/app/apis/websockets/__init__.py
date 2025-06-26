from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
from app.auth import AuthorizedUser

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        # Don't call accept here - it's already accepted in the endpoint
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Create a copy of the list to avoid issues during iteration
        connections_copy = self.active_connections.copy()
        for connection in connections_copy:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error sending message to WebSocket: {e}")
                # Remove dead connections
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

manager = ConnectionManager()

router = APIRouter()

@router.websocket("/ws/fire-updates")
async def websocket_endpoint(websocket: WebSocket, user: AuthorizedUser):
    # Accept the WebSocket connection with the correct protocol
    await websocket.accept("databutton.app")
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive by receiving messages
            # The frontend doesn't need to send messages, so we can just wait
            try:
                await websocket.receive_text()
            except Exception:
                # If receive fails, the connection is probably closed
                break
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Example of how to use the manager to broadcast updates from another endpoint
# This is just a conceptual example.
async def notify_clients_of_update():
    """
    This function can be called from other parts of the application
    (e.g., after a new fire incident is created or updated) to
    notify all connected WebSocket clients.
    """
    await manager.broadcast("fires_updated")
