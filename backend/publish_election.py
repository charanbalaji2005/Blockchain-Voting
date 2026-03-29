#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.models import Election
from voting.views import get_contract
from django.conf import settings

election = Election.objects.get(id=4)
w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)

print(f"Publishing election: {election.title}")

# Create election on blockchain
start_ts = int(election.start_time.timestamp())
end_ts = int(election.end_time.timestamp())

tx = contract.functions.createElection(
    election.title,
    election.description,
    start_ts,
    end_ts
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 300000,
    'gasPrice': w3.eth.gas_price,
})

signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print(f"Transaction sent: {tx_hash.hex()}")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Transaction confirmed in block {receipt['blockNumber']}")
print(f"Transaction status: {receipt['status']}")

if receipt['status'] != 1:
    print("ERROR: Transaction failed on blockchain!")
    exit(1)

# Get election count AFTER creating the election
election_count = contract.functions.electionCount().call()
blockchain_id = election_count - 1 if election_count > 0 else 0  # Get the last election ID

print(f"Election count on blockchain: {election_count}")
print(f"Our election blockchain ID: {blockchain_id}")

if blockchain_id < 0:
    print("ERROR: Election was not created on blockchain!")
    exit(1)

election.blockchain_election_id = blockchain_id
election.status = 'active'
election.save()

print(f"✓ Election published with blockchain ID: {blockchain_id}")

# Now publish candidates
print(f"\nPublishing {election.candidates.count()} candidates...")

for idx, candidate in enumerate(election.candidates.all()):
    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.addCandidate(
        blockchain_id,
        candidate.name,
        candidate.party,
        ''
    ).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
    })
    signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    candidate_count = contract.functions.candidateCount(blockchain_id).call()
    candidate.blockchain_candidate_id = idx  # Use the loop index as candidate ID (0-indexed)
    candidate.save()
    print(f"  ✓ {candidate.name} (Blockchain ID: {candidate.blockchain_candidate_id})")

print("\n✓ All done! Election and candidates are on blockchain.")
