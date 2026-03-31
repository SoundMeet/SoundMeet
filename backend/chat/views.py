from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    
    Profile.objects.create(user=user, display_name=username[:15])
    
    token = Token.objects.create(user=user)

    return Response({
        'token': token.key,
        'user_id': user.id,
        'username': user.username
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile, created = Profile.objects.get_or_create(
        user=request.user,
        defaults={'display_name': request.user.username[:15]}
    )
    
    return Response({
        'display_name': profile.display_name,
        'about': profile.about,
        'spectator': profile.spectator,
        'pfp': profile.pfp.url if profile.pfp else None,
        'country': profile.country,
        'city': profile.city,
        'age': profile.age,
        'gender': profile.gender,
        'instruments_liked': list(profile.instruments_liked.values('id', 'name', 'family')),
        'genres_liked': list(profile.genres_liked.values('id', 'name')), 
        'vibes_liked': list(profile.vibes_liked.values('id', 'name')),
        'friends_count': profile.friends_count,
    })
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    request.user.auth_token.delete()
    return Response({'message': 'Successfully logged out'}, status=200)