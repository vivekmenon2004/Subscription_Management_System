"""
WSGI config for backend (Render / Production entrypoint).
Exposes the WSGI callable as a module-level variable named `application`.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so brightloop and apps can be imported
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brightloop.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()

