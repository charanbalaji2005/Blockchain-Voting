#!/usr/bin/env python
"""
Reset voting for demo purposes
This clears the vote from the database so you can vote again
Note: The blockchain vote cannot be reset (by design), but the frontend
will allow you to vote again and show the transaction
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.models import Vote

# Delete all votes for election 4
deleted = Vote.objects.filter(election_id=4).delete()
print(f"✓ Deleted {deleted[0]} votes from database")
print("\nYou can now vote again!")
print("Note: The blockchain still has the vote recorded (immutable),")
print("but the app will let you submit a new transaction for demo purposes.")
