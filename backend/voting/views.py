import json
import random
import hashlib
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from web3 import Web3

from .models import Election, Candidate, VoterRegistration, Vote, AuditLog
from .serializers import (
    UserSerializer, RegisterSerializer, ElectionListSerializer,
    ElectionDetailSerializer, CreateElectionSerializer, CandidateSerializer,
    VoterRegistrationSerializer, CastVoteSerializer, VoteSerializer, AuditLogSerializer
)

User = get_user_model()

# Web3 Setup
def get_web3():
    return Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))

def get_contract():
    w3 = get_web3()
    contract_path = Path(__file__).parent.parent / 'core' / 'contract.json'
    if not contract_path.exists():
        return None, None
    with open(contract_path) as f:
        data = json.load(f)
    if not data.get('address') or data['address'] == '0x0000000000000000000000000000000000000000':
        return None, None
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(data['address']),
        abi=data['abi']
    )
    return w3, contract

def log_action(user, action, detail=None, request=None, tx_hash=''):
    ip = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        user=user, action=action,
        detail=detail or {},
        ip_address=ip,
        tx_hash=tx_hash
    )

# Auth Views
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_action(user, 'register', {'username': user.username}, request)
        return Response(
            {'message': 'Account created. Please verify your identity.'},
            status=status.HTTP_201_CREATED
        )

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

# OTP Views
@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    if not User.objects.filter(email=email).exists():
        return Response({'error': 'No account found with this email'}, status=404)
    otp = str(random.randint(100000, 999999))
    cache.set(f'otp_{email}', otp, timeout=300)
    try:
        send_mail(
            subject='VoteChain — Your Email Verification OTP',
            message=(
                f'Your VoteChain verification OTP is: {otp}\n\n'
                f'This OTP is valid for 5 minutes.\n'
                f'Do not share this with anyone.\n\n'
                f'If you did not request this, ignore this email.'
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': f'OTP sent to {email}'})
    except Exception as e:
        return Response({'error': f'Email sending failed: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp   = request.data.get('otp')
    if not email or not otp:
        return Response({'error': 'Email and OTP required'}, status=400)
    cached_otp = cache.get(f'otp_{email}')
    if not cached_otp:
        return Response({'error': 'OTP expired. Please request a new one.'}, status=400)
    if str(cached_otp) != str(otp):
        return Response({'error': 'Incorrect OTP. Please try again.'}, status=400)
    cache.delete(f'otp_{email}')
    try:
        user = User.objects.get(email=email)
        user.is_verified = True
        user.save()
        log_action(user, 'verify', {'email': email}, request)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    return Response({'message': 'Email verified successfully! You can now login.'})

# Identity Verification (AWS Rekognition)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def verify_identity(request):
    id_photo = request.FILES.get('id_photo')
    selfie   = request.FILES.get('selfie')
    if not id_photo or not selfie:
        return Response({'error': 'Both id_photo and selfie are required'}, status=400)
    if request.user.is_verified:
        return Response({'message': 'Already verified', 'verified': True})
    if not getattr(settings, 'AWS_ACCESS_KEY_ID', None) or not getattr(settings, 'AWS_SECRET_ACCESS_KEY', None):
        return Response({
            'verified': False,
            'similarity': 0,
            'message': 'Documents uploaded. Sent for manual admin review.',
            'status': 'pending_review'
        })
    try:
        import boto3
        client = boto3.client(
            'rekognition',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=getattr(settings, 'AWS_REGION', 'ap-south-1'),
        )
        response = client.compare_faces(
            SourceImage={'Bytes': id_photo.read()},
            TargetImage={'Bytes': selfie.read()},
            SimilarityThreshold=50,
        )
        matches = response.get('FaceMatches', [])
        if matches:
            similarity = matches[0]['Similarity']
            threshold = getattr(settings, 'FACE_MATCH_THRESHOLD', 90)
            if similarity >= threshold:
                request.user.is_verified = True
                request.user.save()
                log_action(request.user, 'verify',
                          {'method': 'face_match', 'similarity': similarity}, request)
                return Response({
                    'verified': True,
                    'similarity': round(similarity, 2),
                    'message': f'Identity verified! Face match: {similarity:.1f}%'
                })
            else:
                return Response({
                    'verified': False,
                    'similarity': round(similarity, 2),
                    'message': f'Low confidence ({similarity:.1f}%). Sent for manual admin review.',
                    'status': 'pending_review'
                })
        else:
            return Response({
                'verified': False,
                'similarity': 0,
                'message': 'No face detected. Please use clear, well-lit photos.',
            }, status=400)
    except ImportError:
        return Response({'error': 'boto3 not installed. Run: pip install boto3'}, status=500)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Election Views
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ElectionDetailSerializer
        if self.action == 'create':
            return CreateElectionSerializer
        return ElectionListSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'publish_to_blockchain', 'end_election']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def publish_to_blockchain(self, request, pk=None):
        election = self.get_object()
        if election.blockchain_election_id:
            return Response({'error': 'Already on blockchain'}, status=400)
        w3, contract = get_contract()
        if not contract:
            return Response({'error': 'Contract not configured. Deploy contract first.'}, status=503)
        try:
            account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)
            start_ts = int(election.start_time.timestamp())
            end_ts = int(election.end_time.timestamp())
            tx = contract.functions.createElection(
                election.title, election.description, start_ts, end_ts
            ).build_transaction({
                'from': account.address,
                'nonce': w3.eth.get_transaction_count(account.address),
                'gas': 300000,
                'gasPrice': w3.eth.gas_price,
            })
            signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            logs = contract.events.ElectionCreated().process_receipt(receipt)
            blockchain_id = logs[0]['args']['electionId']
            election.blockchain_election_id = blockchain_id
            election.status = 'upcoming'
            election.save()
            log_action(request.user, 'election_create',
                      {'election_id': election.id, 'blockchain_id': blockchain_id},
                      request, tx_hash.hex())
            return Response({
                'blockchain_election_id': blockchain_id,
                'tx_hash': tx_hash.hex(),
                'status': 'deployed'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def end_election(self, request, pk=None):
        election = self.get_object()
        if not election.blockchain_election_id:
            return Response({'error': 'Not on blockchain'}, status=400)
        w3, contract = get_contract()
        if not contract:
            return Response({'error': 'Contract not configured'}, status=503)
        try:
            account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)
            tx = contract.functions.endElection(
                election.blockchain_election_id
            ).build_transaction({
                'from': account.address,
                'nonce': w3.eth.get_transaction_count(account.address),
                'gas': 100000,
                'gasPrice': w3.eth.gas_price,
            })
            signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            w3.eth.wait_for_transaction_receipt(tx_hash)
            election.status = 'ended'
            election.save()
            return Response({'tx_hash': tx_hash.hex(), 'status': 'ended'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# Candidate Views
class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        election_id = self.kwargs.get('election_pk')
        return Candidate.objects.filter(election_id=election_id)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        election_id = self.kwargs.get('election_pk')
        election = Election.objects.get(pk=election_id)
        candidate = serializer.save(election=election)
        if election.blockchain_election_id:
            w3, contract = get_contract()
            if contract:
                try:
                    account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)
                    tx = contract.functions.addCandidate(
                        election.blockchain_election_id,
                        candidate.name,
                        candidate.party,
                        candidate.photo_ipfs_hash or ''
                    ).build_transaction({
                        'from': account.address,
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'gas': 200000,
                        'gasPrice': w3.eth.gas_price,
                    })
                    signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
                    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                    logs = contract.events.CandidateAdded().process_receipt(receipt)
                    candidate.blockchain_candidate_id = logs[0]['args']['candidateId']
                    candidate.save()
                except Exception:
                    pass

# Voter Registration Views
class VoterRegistrationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def register(self, request):
        election_id = request.data.get('election_id')
        try:
            election = Election.objects.get(pk=election_id)
        except Election.DoesNotExist:
            return Response({'error': 'Election not found'}, status=404)
        if VoterRegistration.objects.filter(user=request.user, election=election).exists():
            return Response({'error': 'Already registered for this election'}, status=400)
        if not request.user.is_verified:
            return Response({'error': 'Identity verification required before registering to vote'}, status=403)
        reg = VoterRegistration.objects.create(
            user=request.user,
            election=election,
            status='pending'
        )
        return Response({
            'registration_id': reg.id,
            'status': 'pending',
            'message': 'Registration submitted. Awaiting admin approval.'
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        try:
            reg = VoterRegistration.objects.get(pk=pk)
        except VoterRegistration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=404)
        if reg.status not in ['pending', 'approved']:
            return Response({'error': 'Not in pending state'}, status=400)
        w3, contract = get_contract()
        if not contract or not reg.election.blockchain_election_id:
            reg.status = 'blockchain_registered'
            reg.approved_at = timezone.now()
            reg.save()
            return Response({'status': 'approved', 'message': 'Approved (no blockchain configured)'})
        voter_wallet = reg.user.wallet_address
        if not voter_wallet:
            reg.status = 'blockchain_registered'
            reg.approved_at = timezone.now()
            reg.save()
            return Response({'status': 'approved', 'message': 'Approved (no wallet — skipped blockchain)'})
        try:
            account = w3.eth.account.from_key(settings.ADMIN_PRIVATE_KEY)
            tx = contract.functions.registerVoter(
                reg.election.blockchain_election_id,
                Web3.to_checksum_address(voter_wallet)
            ).build_transaction({
                'from': account.address,
                'nonce': w3.eth.get_transaction_count(account.address),
                'gas': 150000,
                'gasPrice': w3.eth.gas_price,
            })
            signed = w3.eth.account.sign_transaction(tx, settings.ADMIN_PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            w3.eth.wait_for_transaction_receipt(tx_hash)
            reg.status = 'blockchain_registered'
            reg.blockchain_tx_hash = tx_hash.hex()
            reg.approved_at = timezone.now()
            reg.save()
            log_action(request.user, 'voter_register',
                      {'voter': reg.user.username, 'election': reg.election.title},
                      request, tx_hash.hex())
            return Response({'status': 'approved', 'tx_hash': tx_hash.hex()})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# Vote Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_vote(request):
    serializer = CastVoteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    election_id  = serializer.validated_data['election_id']
    candidate_id = serializer.validated_data['candidate_id']
    tx_hash      = serializer.validated_data['tx_hash']
    try:
        election  = Election.objects.get(pk=election_id)
        candidate = Candidate.objects.get(pk=candidate_id, election=election)
    except (Election.DoesNotExist, Candidate.DoesNotExist):
        return Response({'error': 'Invalid election or candidate'}, status=404)
    if Vote.objects.filter(user=request.user, election=election).exists():
        return Response({'error': 'You have already voted in this election'}, status=400)
    w3, _ = get_contract()
    if w3:
        try:
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            if not receipt or receipt.status != 1:
                return Response({'error': 'Transaction failed or not found on blockchain'}, status=400)
        except Exception:
            pass
    Vote.objects.create(
        user=request.user,
        election=election,
        candidate=candidate,
        blockchain_tx_hash=tx_hash,
    )
    log_action(request.user, 'vote_cast',
              {'election': election.title, 'tx_hash': tx_hash},
              request, tx_hash)
    return Response({'message': 'Vote recorded successfully', 'tx_hash': tx_hash}, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def election_results(request, pk):
    try:
        election = Election.objects.get(pk=pk)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found'}, status=404)
    candidates = Candidate.objects.filter(election=election)
    total = election.total_votes
    results = []
    for c in candidates:
        count = c.vote_count
        results.append({
            'id': c.id,
            'name': c.name,
            'party': c.party,
            'photo': request.build_absolute_uri(c.photo.url) if c.photo else None,
            'vote_count': count,
            'percentage': round((count / total * 100), 2) if total > 0 else 0,
        })
    results.sort(key=lambda x: x['vote_count'], reverse=True)
    return Response({
        'election': election.title,
        'total_votes': total,
        'status': election.status,
        'candidates': results,
        'winner': results[0] if results and election.status in ['ended', 'results_published'] else None
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_votes(request):
    votes = Vote.objects.filter(user=request.user).select_related('election', 'candidate')
    serializer = VoteSerializer(votes, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    return Response({
        'total_elections': Election.objects.count(),
        'active_elections': Election.objects.filter(status='active').count(),
        'total_voters': User.objects.filter(is_verified=True).count(),
        'total_votes_cast': Vote.objects.count(),
    })