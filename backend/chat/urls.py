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

    path('api/posts/create/', views.create_post, name='create_post'),
    path('api/jams/create/', views.create_jam, name='create_jam'),

    path('api/friends/request/', views.send_friend_request, name='send_friend_request'),
    path('api/friends/request/<int:request_id>/handle/', views.handle_friend_request, name='handle_friend_request'),

    path('api/bandmates/<int:listing_id>/apply/', views.apply_for_bandmate, name='apply_for_bandmate'),
]