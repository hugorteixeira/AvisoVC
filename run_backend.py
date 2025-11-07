#!/usr/bin/env python
"""Simple script to run the AvisoVC backend server."""

from __future__ import annotations

import uvicorn


def main() -> None:
    """Start the AvisoVC API server."""
    print("=" * 60)
    print("Starting AvisoVC Backend Server")
    print("=" * 60)
    print("\nServer will be available at:")
    print("  - Local:   http://localhost:8000")
    print("  - Network: http://0.0.0.0:8000")
    print("\nPress Ctrl+C to stop the server\n")
    print("=" * 60)

    uvicorn.run(
        "aviso_vc.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()
