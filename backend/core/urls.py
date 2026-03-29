from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from voting import views

router = DefaultRouter()
router.register(r'elections', views.ElectionViewSet, basename='elections')
router.register(r'elections/(?P<election_pk>\d+)/candidates', views.CandidateViewSet, basename='candidates')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Auth
    path('api/auth/register/', views.RegisterView.as_view()),
    path('api/auth/login/', views.EmailTokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/auth/me/', views.MeView.as_view()),
    path('api/auth/send-otp/', views.send_otp),
    path('api/auth/verify-otp/', views.verify_otp),

    # Voting
    path('api/vote/', views.cast_vote),
    path('api/my-votes/', views.my_votes),
    path('api/elections/<int:pk>/results/', views.election_results),
    path('api/verify-identity/', views.verify_identity),

    # Voter registration
    path('api/voter/register/', views.VoterRegistrationViewSet.as_view({'post': 'register'})),
    path('api/voter/<int:pk>/approve/', views.VoterRegistrationViewSet.as_view({'post': 'approve'})),

    # Dashboard
    path('api/stats/', views.dashboard_stats),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)