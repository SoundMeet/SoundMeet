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
    path('api/music-snips/', views.music_snips, name='music_snips'),
    path('api/posts/create/', views.create_post, name='create_post'),
    path('api/posts/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path('api/posts/<int:post_id>/like/', views.like_notify, name='like_notify'),
    path('api/posts/<int:post_id>/comments/', views.create_comment, name='create_comment'),
    path('api/jams/create/', views.create_jam, name='create_jam'),
    path('api/jams/<int:jam_id>/update/', views.update_jam, name='update_jam'),
    path('api/jams/<int:jam_id>/delete/', views.delete_jam, name='delete_jam'),
    path('api/jams/<int:jam_id>/invite/', views.invite_to_jam, name='invite_to_jam'),
    path('api/jams/<int:jam_id>/join-chat/', views.join_jam_chat, name='join_jam_chat'),
    path('api/jams/<int:jam_id>/rate/', views.rate_jam, name='rate_jam'),
    path('api/jams/<int:jam_id>/my-rating/', views.my_jam_rating, name='my_jam_rating'),
    path('api/jams/<int:jam_id>/ratings-summary/', views.jam_ratings_summary, name='jam_ratings_summary'),
    path('api/jams/ratings-bulk/', views.bulk_jam_ratings_summary, name='bulk_jam_ratings_summary'),
    path('api/shows/create/', views.create_show, name='create_show'),
    path('api/shows/<int:show_id>/update/', views.update_show, name='update_show'),
    path('api/shows/<int:show_id>/delete/', views.delete_show, name='delete_show'),
    path('api/bands/create/', views.create_band, name='create_band'),
    path('api/friends/request/', views.send_friend_request, name='send_friend_request'),
    path('api/friends/request/<int:request_id>/handle/', views.handle_friend_request, name='handle_friend_request'),
    path('api/friends/request/<int:request_id>/cancel/', views.cancel_friend_request, name='cancel_friend_request'),
    path('api/bandmates/<int:listing_id>/apply/', views.apply_for_bandmate, name='apply_for_bandmate'),
    path('api/send-verification-code/', views.send_verification_code, name='send_verification_code'),
    path('api/verify-code/', views.verify_code, name='verify_code'),
    path('api/auth/google/', views.google_auth, name='google_auth'),
    path('api/auth/finalize-google/', views.finalize_google_signup, name='finalize_google_signup'),
    path('api/account/change-password/', views.change_password, name='change_password'),
    path('api/account/delete/', views.delete_account, name='delete_account'),
    path('api/forgot-password/', views.forgot_password, name='forgot_password'),
    path('api/reset-password/', views.reset_password, name='reset_password'),
]
