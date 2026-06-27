import uvicorn
from app.app import create_app
from app.config import PORT, HOST

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
