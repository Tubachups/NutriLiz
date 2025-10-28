
import serial  
import time    

# Initialize serial connection
# - Port: /dev/ttyACM0 (common for Arduino/microcontroller USB connections)
ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1.0)

# Wait 3 seconds for the serial connection to stabilize
# Some devices reset when a serial connection is established
time.sleep(3)

# Clear any data that might be in the input buffer
# Ensures we start reading fresh data
ser.reset_input_buffer()

print("Serial OK")

try:
    while True:
        # Small delay to prevent CPU overuse (10 milliseconds)
        time.sleep(0.01)
        
        # Check if there's data waiting in the serial buffer
        if ser.in_waiting > 0:
            # Read one line from serial port and decode from bytes to string
            # UTF-8 encoding is used for proper character representation
            line = ser.readline().decode('utf-8').rstrip()
            print(line)
            
except KeyboardInterrupt:
    print("Close Serial communication.")
    # Close the serial port to free up resources
    ser.close() 