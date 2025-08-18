#!/usr/bin/env python3
"""
PageKite Clean - Simple PageKite tunnel launcher
A cleaner interface for starting PageKite tunnels
"""
import sys
import os
import subprocess
import signal


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\nShutting down PageKite tunnel...')
    sys.exit(0)


def main():
    if len(sys.argv) != 3:
        print("Usage: python pagekite_clean.py <local_port> <subdomain.pagekite.me>")
        print("Example: python pagekite_clean.py 11434 myapp.pagekite.me")
        sys.exit(1)
    
    local_port = sys.argv[1]
    subdomain = sys.argv[2]
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    print("Starting PageKite tunnel...")
    print("Local port: {0}".format(local_port))
    print("Public URL: https://{0}".format(subdomain))
    print("Press Ctrl+C to stop")
    
    try:
        # Use the full pagekite.py script that's already in the directory
        cmd = [
            sys.executable,
            'pagekite.py',
            local_port,
            subdomain,
        ]
        
        # Prefer subprocess.run if available (Python 3.5+), otherwise fallback
        if hasattr(subprocess, 'run'):
            subprocess.run(cmd, check=True)
        else:
            # Fallback for older Python versions without subprocess.run
            ret = subprocess.call(cmd)
            if ret != 0:
                raise subprocess.CalledProcessError(ret, cmd)
    except subprocess.CalledProcessError as e:
        print("PageKite failed with error: {0}".format(e))
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nPageKite tunnel stopped")
        sys.exit(0)


if __name__ == "__main__":
    main()
