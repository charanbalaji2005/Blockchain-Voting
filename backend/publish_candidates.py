#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.models import Election, Candidate
from voting.views import get_contract
from django.conf import settings
from web3 import Web3

election = Election.objects.get(id=4)
w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)

print(f"Publishing candidates for election {election.title} (Blockchain ID: {election.blockchain_election_id})")

for candidate in election.candidates.all():
    if candidate.blockchain_candidate_id:
        print(f"  ✓ {candidate.name} already published (ID: {candidate.blockchain_candidate_id})")
        continue
    
    try:
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.functions.addCandidate(
            election.blockchain_election_id,
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
        
        # Get candidate count
        candidate_count = contract.functions.candidateCount(election.blockchain_election_id).call()
        candidate.blockchain_candidate_id = candidate_count
        candidate.save()
        print(f"  ✓ Published {candidate.name} (ID: {candidate_count}) - TX: {tx_hash.hex()[:10]}...")
    except Exception as e:
        print(f"  ✗ Error publishing {candidate.name}: {e}")

print("\nDone!")
