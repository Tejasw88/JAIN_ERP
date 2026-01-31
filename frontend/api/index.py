from mangum import Mangum
from server import app

# Wrap FastAPI with Mangum for serverless deployment
handler = Mangum(app, lifespan="off")
