import os
import sys
import time

LOCK_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.synera.lock')

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, 'r') as f:
                pid = f.read().strip()
            print(f"[LOCKED] Repository is currently locked by PID: {pid}. Another AI session is active.")
            sys.exit(1)
        except Exception as e:
            print(f"[WARNING] Lock file exists but cannot be read: {e}")
            sys.exit(1)
            
    with open(LOCK_FILE, 'w') as f:
        f.write(str(os.getpid()))
    print(f"[LOCK ACQUIRED] Lock created for PID: {os.getpid()}")

def release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)
        print("[LOCK RELEASED] Lock file removed.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "release":
        release_lock()
    else:
        acquire_lock()
