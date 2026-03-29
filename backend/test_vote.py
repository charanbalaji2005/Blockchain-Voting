#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.views import get_contract
from django.conf import settings

w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)

# Check election
election = contract.functions.getElection(1).call()
print(f"Election ID 1: {election[1]}")
print(f"Active: {election[5]}")
print(f"Start: {election[3]}, End: {election[4]}")
print(f"Current time: {w3.eth.get_block('latest')['timestamp']}")

# Check candidates
print(f"\nCandidates:")
for i in range(1, 11):
    try:
        candidate = contract.functions.getCandidate(1, i).call()
        print(f"  ID {i}: {candidate[1]} ({candidate[2]}) - Active: {candidate[5]}")
    except Exception as e:
        print(f"  ID {i}: Error - {e}")

# Check voter status
voter_status = contract.functions.getVoterStatus(1, account.address).call()
print(f"\nVoter {account.address}:")
print(f"  Registered: {voter_status[0]}")
print(f"  Has voted: {voter_status[1]}")

# Try to vote for candidate 1
print(f"\nAttempting to vote for candidate 1...")
try:
    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.castVote(1, 1).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
    })
    signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt['status'] == 1:
        print(f"✓ Vote successful! TX: {tx_hash.hex()}")
    else:
        print(f"✗ Vote failed")
except Exception as e:
    print(f"✗ Error: {e}")
