import sys
import os

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mangum import Mangum
from server import app

handler = Mangum(app, lifespan='off')

