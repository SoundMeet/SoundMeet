from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile, Post

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

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile, created = Profile.objects.get_or_create(
        user=request.user,
        defaults={'display_name': request.user.username[:15]}
    )
    
    if request.method == 'PATCH':
        data = request.data
        
        if 'display_name' in data: profile.display_name = data['display_name']
        if 'about' in data: profile.about = data['about']
        if 'country' in data: profile.country = data['country']
        if 'city' in data: profile.city = data['city']
        if 'gender' in data: profile.gender = data['gender']
        
        if 'spectator' in data:
            profile.spectator = str(data['spectator']).lower() == 'true'
            
        if 'age' in data:
            profile.age = int(data['age']) if data['age'] else None
            
        if 'pfp' in request.FILES:
            profile.pfp = request.FILES['pfp']
            
        profile.save()

        def update_m2m(field_name, m2m_manager):
            if field_name in data:
                items = data.getlist(field_name) if hasattr(data, 'getlist') else data[field_name]
                
                if items == [''] or items == "":
                    m2m_manager.clear()
                else:
                    valid_ids = [int(i) for i in items if str(i).isdigit()]
                    m2m_manager.set(valid_ids)

        update_m2m('instruments_liked', profile.instruments_liked)
        update_m2m('genres_liked', profile.genres_liked)
        update_m2m('vibes_liked', profile.vibes_liked)

    return Response({
        'id': request.user.id,
        'username': request.user.username,
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
def create_post(request):
    content = request.data.get('content', '')
    image = request.FILES.get('image', None)

    if not content and not image:
        return Response({'error': 'Post must contain text or an image.'}, status=400)

    post = Post.objects.create(
        author=request.user,
        content=content,
        image=image
    )

    return Response({
        'id': post.id,
        'content': post.content,
        'image': post.image.url if post.image else None,
        'author_id': post.author.id,
        'created_at': post.created_at
    }, status=201)