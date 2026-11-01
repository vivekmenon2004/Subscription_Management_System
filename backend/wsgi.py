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
from django.core.management import call_command

application = get_wsgi_application()

try:
    call_command('migrate', interactive=False)
    from apps.accounts.models import User
    if not User.objects.filter(role=User.Role.ADMIN).exists():
        import seed_data
        seed_data.run_seed()
except Exception as e:
    print(f"[WSGI Init] Auto-migration / seed status: {e}")
