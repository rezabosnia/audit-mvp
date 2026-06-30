"""
Start both backend and frontend dev servers concurrently.
Run from the repo root: python start.py
"""

import subprocess
import sys
import os
import signal
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

processes = []


def stream(proc, prefix):
    for line in iter(proc.stdout.readline, b""):
        print(f"[{prefix}] {line.decode(errors='replace').rstrip()}")


def shutdown(sig=None, frame=None):
    print("\nShutting down...")
    for p in processes:
        p.terminate()
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
if hasattr(signal, "SIGTERM"):
    signal.signal(signal.SIGTERM, shutdown)

print("Starting backend on http://localhost:8002 ...")
backend = subprocess.Popen(
    ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"],
    cwd=BACKEND_DIR,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)
processes.append(backend)
threading.Thread(target=stream, args=(backend, "backend"), daemon=True).start()

print("Starting frontend on http://localhost:3000 ...")
frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=FRONTEND_DIR,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    shell=(sys.platform == "win32"),
)
processes.append(frontend)
threading.Thread(target=stream, args=(frontend, "frontend"), daemon=True).start()

print("\nBoth servers running. Open http://localhost:3000")
print("Press Ctrl+C to stop.\n")

for p in processes:
    p.wait()
