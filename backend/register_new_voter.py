#!/usr/bin/env python
"""
Register a new voter for demo
Usage: python register_new_voter.py <wallet_address>
"""
import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.views import get_contract
from django.conf import settings
from web3 import Web3

if len(sys.argv) < 2:
    print("Usage: python register_new_voter.py <wallet_address>")
    print("\nExample: python register_new_voter.py 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    sys.exit(1)

voter_address = sys.argv[1]

if not voter_address.startswith('0x') or len(voter_address) != 42:
    print("Error: Invalid wallet address format")
    print("Address should start with 0x and be 42 characters long")
    sys.exit(1)

w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)

print(f"Registering voter: {voter_address}")

# Check if already registered
status = contract.functions.getVoterStatus(1, Web3.to_checksum_address(voter_address)).call()
if status[0]:
    print(f"✓ Already registered!")
    print(f"  Has voted: {status[1]}")
    sys.exit(0)

# Register the voter
nonce = w3.eth.get_transaction_count(account.address)
tx = contract.functions.registerVoter(
    1,  # Election ID
    Web3.to_checksum_address(voter_address)
).build_transaction({
    'from': account.address,
    'nonce': nonce,
    'gas': 150000,
    'gasPrice': w3.eth.gas_price,
})

signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

if receipt['status'] == 1:
    print(f"✓ Voter registered successfully!")
    print(f"  TX: {tx_hash.hex()}")
    print(f"\nYou can now vote with this wallet!")
else:
    print(f"✗ Registration failed")
