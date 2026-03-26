from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Election, Candidate, VoterRegistration, Vote, AuditLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'wallet_address', 'is_verified',
                  'profile_image', 'first_name', 'last_name', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password',
                  'first_name', 'last_name', 'wallet_address',
                  'phone_number', 'date_of_birth']

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CandidateSerializer(serializers.ModelSerializer):
    vote_count = serializers.ReadOnlyField()
    vote_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'description', 'photo',
                  'blockchain_candidate_id', 'manifesto', 'vote_count',
                  'vote_percentage', 'created_at']

    def get_vote_percentage(self, obj):
        total = obj.election.total_votes
        if total == 0:
            return 0
        return round((obj.vote_count / total) * 100, 2)


class ElectionListSerializer(serializers.ModelSerializer):
    total_votes = serializers.ReadOnlyField()
    candidates_count = serializers.SerializerMethodField()
    is_live = serializers.ReadOnlyField()

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_time', 'end_time',
                  'status', 'blockchain_election_id', 'banner_image',
                  'total_votes', 'candidates_count', 'is_live', 'created_at']

    def get_candidates_count(self, obj):
        return obj.candidates.count()


class ElectionDetailSerializer(ElectionListSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    user_registration = serializers.SerializerMethodField()
    user_has_voted = serializers.SerializerMethodField()

    class Meta(ElectionListSerializer.Meta):
        fields = ElectionListSerializer.Meta.fields + ['candidates', 'user_registration', 'user_has_voted']

    def get_user_registration(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reg = VoterRegistration.objects.filter(user=request.user, election=obj).first()
            if reg:
                return {'status': reg.status, 'tx_hash': reg.blockchain_tx_hash}
        return None

    def get_user_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, election=obj).exists()
        return False


class CreateElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = ['title', 'description', 'start_time', 'end_time', 'banner_image']


class VoterRegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    election_title = serializers.CharField(source='election.title', read_only=True)

    class Meta:
        model = VoterRegistration
        fields = ['id', 'user', 'election', 'election_title', 'status',
                  'blockchain_tx_hash', 'registered_at', 'approved_at']
        read_only_fields = ['status', 'blockchain_tx_hash', 'approved_at']


class CastVoteSerializer(serializers.Serializer):
    election_id = serializers.IntegerField()
    candidate_id = serializers.IntegerField()
    tx_hash = serializers.CharField(max_length=66)

    def validate_tx_hash(self, value):
        if not value.startswith('0x') or len(value) != 66:
            raise serializers.ValidationError("Invalid transaction hash format.")
        return value


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'election', 'blockchain_tx_hash', 'block_number', 'voted_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'detail', 'tx_hash', 'timestamp']