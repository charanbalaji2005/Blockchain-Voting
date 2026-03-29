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

print(f"Publishing candidates for election blockchain ID: {election.blockchain_election_id}")

for idx, candidate in enumerate(election.candidates.all().order_by('id'), start=1):
    print(f"\n{idx}. {candidate.name} ({candidate.party})")
    
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
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
        })
        signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        print(f"   TX sent: {tx_hash.hex()[:20]}...")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt['status'] == 1:
            candidate.blockchain_candidate_id = idx
            candidate.save()
            print(f"   ✓ Published with blockchain ID: {idx}")
        else:
            print(f"   ✗ Transaction failed")
    except Exception as e:
        print(f"   ✗ Error: {e}")

print("\n\nVerifying candidates on blockchain:")
for i in range(1, 11):
    try:
        c = contract.functions.getCandidate(1, i).call()
        print(f"  {i}. {c[1]} ({c[2]}) - Active: {c[5]}")
    except:
        print(f"  {i}. Not found")
