from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """Extended user with wallet and verification"""
    wallet_address = models.CharField(max_length=42, unique=True, null=True, blank=True)
    national_id_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)  # SHA-256 of ID
    is_verified = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.wallet_address or 'No wallet'})"


class Election(models.Model):
    """Election / Poll created by admin"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('results_published', 'Results Published'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    blockchain_election_id = models.PositiveIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_elections')
    banner_image = models.ImageField(upload_to='elections/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'elections'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_live(self):
        now = timezone.now()
        return self.status == 'active' and self.start_time <= now <= self.end_time

    @property
    def total_votes(self):
        return Vote.objects.filter(election=self).count()


class Candidate(models.Model):
    """Candidate in an election"""
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=255)
    party = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='candidates/', null=True, blank=True)
    photo_ipfs_hash = models.CharField(max_length=100, blank=True)
    blockchain_candidate_id = models.PositiveIntegerField(null=True, blank=True)
    manifesto = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'candidates'

    def __str__(self):
        return f"{self.name} ({self.party})"

    @property
    def vote_count(self):
        return Vote.objects.filter(candidate=self).count()


class VoterRegistration(models.Model):
    """Tracks voter registration per election"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('blockchain_registered', 'Blockchain Registered'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registrations')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')
    blockchain_tx_hash = models.CharField(max_length=66, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'voter_registrations'
        unique_together = ['user', 'election']

    def __str__(self):
        return f"{self.user.username} → {self.election.title}"


class Vote(models.Model):
    """Immutable vote record"""
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='votes')
    election = models.ForeignKey(Election, on_delete=models.PROTECT, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.PROTECT, related_name='votes')
    blockchain_tx_hash = models.CharField(max_length=66, unique=True)
    block_number = models.PositiveIntegerField(null=True, blank=True)
    gas_used = models.PositiveIntegerField(null=True, blank=True)
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votes'
        unique_together = ['user', 'election']  # One vote per election

    def __str__(self):
        return f"Vote by {self.user.username} in {self.election.title}"


class AuditLog(models.Model):
    """Audit trail for all important actions"""
    ACTION_CHOICES = [
        ('register', 'User Registered'),
        ('verify', 'User Verified'),
        ('election_create', 'Election Created'),
        ('candidate_add', 'Candidate Added'),
        ('voter_register', 'Voter Registered'),
        ('vote_cast', 'Vote Cast'),
        ('election_end', 'Election Ended'),
        ('results_publish', 'Results Published'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    detail = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    tx_hash = models.CharField(max_length=66, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']