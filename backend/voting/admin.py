from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Election, Candidate, VoterRegistration, Vote, AuditLog

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'wallet_address', 'is_verified', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Blockchain', {'fields': ('wallet_address', 'is_verified', 'phone_number', 'date_of_birth')}),
    )
    actions = ['verify_users']
    def verify_users(self, request, queryset):
        queryset.update(is_verified=True)
    verify_users.short_description = 'Mark selected users as verified'

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'start_time', 'end_time']
    list_filter = ['status']
    actions = ['mark_active', 'mark_ended']
    def mark_active(self, request, queryset):
        queryset.update(status='active')
    mark_active.short_description = 'Set status: Active'
    def mark_ended(self, request, queryset):
        queryset.update(status='ended')
    mark_ended.short_description = 'Set status: Ended'

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'party', 'election']
    list_filter = ['election']

@admin.register(VoterRegistration)
class VoterRegistrationAdmin(admin.ModelAdmin):
    list_display = ['user', 'election', 'status', 'registered_at']
    list_filter = ['status']
    actions = ['approve_registrations']
    def approve_registrations(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='pending').update(
            status='blockchain_registered',
            approved_at=timezone.now()
        )
    approve_registrations.short_description = 'Approve selected registrations'

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'election', 'candidate', 'voted_at']
    readonly_fields = ['user', 'election', 'candidate', 'blockchain_tx_hash', 'voted_at']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'timestamp']
    readonly_fields = ['user', 'action', 'detail', 'ip_address', 'tx_hash', 'timestamp']
