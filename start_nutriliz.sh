#!/bin/bash

# Wait for the system to fully initialize
sleep 10

# Set display for browser (needed for autostart)
export DISPLAY=:0

# Navigate to project directory
cd ~/Desktop/NutriLiz

# Start the Python backend in background
echo "Starting backend..."
cd backend
. .venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start the frontend dev server in background
echo "Starting frontend..."
cd fe-web
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
sleep 10

# Open browser to the frontend URL
echo "Opening browser..."
chromium-browser --start-fullscreen http://localhost:5173/ &

# Keep script running and handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

# Wait for both processes
wait
