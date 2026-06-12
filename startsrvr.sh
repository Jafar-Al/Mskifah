#!/bin/bash

# Start npm dev server
screen -dmS dev_full bash -c "npm run dev:full"

# Start cloudflared tunnel
screen -dmS cloudflare_tunnel bash -c "cloudflared tunnel run --token eyJhIjoiMzVkMThiMzZhNDU4ZDgyYjIyNWVhYmE3ZDdiN2E5YzIiLCJ0IjoiZThlM2Q4NjUtMDdkNC00ZjdiLTkwM2EtM2E2YmQwYzBjZTU1IiwicyI6Ik5JN3FKc2ozSXdRWkovaE1XQTRnMUdqWEpndTF0TG4rbmpCSVMxRnptQmM9In0="

echo "Services started:"
echo " - Screen session: dev_full"
echo " - Screen session: cloudflare_tunnel"
