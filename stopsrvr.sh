#!/bin/bash

# Stop npm dev server
screen -S dev_full -X quit

# Stop cloudflare tunnel
screen -S cloudflare_tunnel -X quit

echo "Services stopped."
