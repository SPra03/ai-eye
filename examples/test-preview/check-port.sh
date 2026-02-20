#!/bin/bash

# Check what's using port 5173 (or custom port)
PORT=${1:-5173}

echo "Checking what's using port $PORT..."
echo ""

# Find process using the port
PID=$(lsof -ti :$PORT)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is available!"
else
    echo "⚠️  Port $PORT is in use by:"
    lsof -i :$PORT
    echo ""
    echo "To kill this process, run:"
    echo "  kill -9 $PID"
    echo ""
    echo "Or just run the server - it will automatically use the next available port!"
fi
