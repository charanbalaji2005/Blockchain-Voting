#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.views import get_contract

w3, contract = get_contract()

print("Checking blockchain state...")
print(f"Contract address: {contract.address}")

try:
    election_count = contract.functions.electionCount().call()
    print(f"Total elections on blockchain: {election_count}")
    
    if election_count > 0:
        for i in range(election_count):
            election = contract.functions.getElection(i).call()
            print(f"\nElection {i}:")
            print(f"  Title: {election[1]}")
            print(f"  Description: {election[2]}")
            print(f"  Active: {election[5]}")
            
            candidate_count = contract.functions.candidateCount(i).call()
            print(f"  Candidates: {candidate_count}")
    else:
        print("\nNo elections found on blockchain!")
        
except Exception as e:
    print(f"Error: {e}")
