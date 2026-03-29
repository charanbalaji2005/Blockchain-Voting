from django.core.management.base import BaseCommand
from voting.models import User, Election, Candidate, Vote
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Creates test data for the voting application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating test data...')

        # Create test users
        users = []
        
        # Admin user
        admin, created = User.objects.get_or_create(
            email='admin@test.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: admin@test.com / admin123'))
        
        # Regular test users
        for i in range(1, 6):
            user, created = User.objects.get_or_create(
                email=f'user{i}@test.com',
                defaults={
                    'username': f'user{i}',
                    'first_name': f'Test{i}',
                    'last_name': f'User{i}',
                }
            )
            if created:
                user.set_password('test123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: user{i}@test.com / test123'))
            users.append(user)

        # Create test elections
        elections_data = [
            {
                'title': 'Indian General Election 2026',
                'description': 'Vote for your preferred political party in the upcoming general election',
                'start_time': timezone.now() - timedelta(days=1),
                'end_time': timezone.now() + timedelta(days=30),
                'status': 'active',
                'candidates': [
                    {'name': 'Bharatiya Janata Party (BJP)', 'party': 'BJP'},
                    {'name': 'Indian National Congress (INC)', 'party': 'INC'},
                    {'name': 'Aam Aadmi Party (AAP)', 'party': 'AAP'},
                    {'name': 'Trinamool Congress (TMC)', 'party': 'TMC'},
                    {'name': 'Shiv Sena', 'party': 'Shiv Sena'},
                    {'name': 'Samajwadi Party (SP)', 'party': 'SP'},
                    {'name': 'Bahujan Samaj Party (BSP)', 'party': 'BSP'},
                    {'name': 'Communist Party of India (Marxist)', 'party': 'CPI(M)'},
                    {'name': 'Nationalist Congress Party (NCP)', 'party': 'NCP'},
                    {'name': 'Dravida Munnetra Kazhagam (DMK)', 'party': 'DMK'},
                ]
            },
            {
                'title': 'Presidential Election 2026',
                'description': 'Vote for the next president',
                'start_time': timezone.now() - timedelta(days=1),
                'end_time': timezone.now() + timedelta(days=7),
                'status': 'active',
                'candidates': [
                    {'name': 'Alice Johnson', 'party': 'Democratic Party'},
                    {'name': 'Bob Smith', 'party': 'Republican Party'},
                    {'name': 'Carol Williams', 'party': 'Independent'}
                ]
            },
            {
                'title': 'Student Council President',
                'description': 'Choose your student council president',
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(days=14),
                'status': 'active',
                'candidates': [
                    {'name': 'David Brown', 'party': 'Student Unity'},
                    {'name': 'Emma Davis', 'party': 'Progressive Students'},
                    {'name': 'Frank Miller', 'party': 'Independent'}
                ]
            },
            {
                'title': 'Best Programming Language 2026',
                'description': 'Vote for your favorite programming language',
                'start_time': timezone.now() - timedelta(days=2),
                'end_time': timezone.now() + timedelta(days=5),
                'status': 'active',
                'candidates': [
                    {'name': 'Python', 'party': 'Team Python'},
                    {'name': 'JavaScript', 'party': 'Team JS'},
                    {'name': 'Rust', 'party': 'Team Rust'},
                    {'name': 'Go', 'party': 'Team Go'}
                ]
            },
        ]

        for election_data in elections_data:
            election, created = Election.objects.get_or_create(
                title=election_data['title'],
                defaults={
                    'description': election_data['description'],
                    'start_time': election_data['start_time'],
                    'end_time': election_data['end_time'],
                    'status': election_data['status'],
                    'created_by': admin,
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created election: {election.title}'))
                
                # Create candidates
                for candidate_data in election_data['candidates']:
                    candidate = Candidate.objects.create(
                        election=election,
                        name=candidate_data['name'],
                        party=candidate_data['party'],
                        description=f'Candidate {candidate_data["name"]} for {election.title}'
                    )
                    self.stdout.write(f'  - Added candidate: {candidate_data["name"]} ({candidate_data["party"]})')

        self.stdout.write(self.style.SUCCESS('\nTest data created successfully!'))
        self.stdout.write('\nTest Accounts:')
        self.stdout.write('  Admin: admin@test.com / admin123')
        self.stdout.write('  Users: user1@test.com to user5@test.com / test123')
