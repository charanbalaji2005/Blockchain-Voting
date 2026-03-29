#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.models import Election
from voting.views import get_contract
from django.conf import settings
from web3 import Web3

# Fix the election ID (contract uses 1-based indexing)
election = Election.objects.get(id=4)
election.blockchain_election_id = 1  # First election in contract is ID 1, not 0
election.save()
print(f"✓ Updated election blockchain_election_id to 1")

# Register the admin wallet as a voter
w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)
admin_address = account.address

print(f"\nRegistering voter: {admin_address}")

nonce = w3.eth.get_transaction_count(account.address)
tx = contract.functions.registerVoter(
    1,  # Election ID 1
    Web3.to_checksum_address(admin_address)
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
else:
    print(f"✗ Registration failed")

# Check voter status
status = contract.functions.getVoterStatus(1, admin_address).call()
print(f"\nVoter status:")
print(f"  Registered: {status[0]}")
print(f"  Has voted: {status[1]}")
