#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from voting.views import get_contract
from django.conf import settings
from web3 import Web3

w3, contract = get_contract()
account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)

print(f"Our wallet address: {account.address}")
print(f"Contract admin: {contract.functions.admin().call()}")
print(f"Are we admin? {account.address.lower() == contract.functions.admin().call().lower()}")
