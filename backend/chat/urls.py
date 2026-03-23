from django.urls import path
from django.http import HttpResponse
from rest_framework.authtoken.views import obtain_auth_token
from . import views

def home(request):
    return HttpResponse("We are live!")

urlpatterns = [
    path('', home),

    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    
    path('api/register/', views.register_user, name='register'),
    
    path('api/profiles/me/', views.get_profile, name='get_profile'),
]