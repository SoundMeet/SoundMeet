from django.shortcuts import render, get_object_or_404
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry
from django.db import transaction
from .models import (
    Profile, Post, Comment, FriendRequest, Notification,
    BandmateListing, BandmateCandidate, Jam, Show, Genre, Band, Conversation
)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Content is required'}, status=400)

    comment = Comment.objects.create(post=post, author=request.user, content=content)

    # Notify the post author — skip self-comments
    if post.author != request.user:
        Notification.objects.create(
            user=post.author,
            notification_type='POST_COMMENT',
            message=f"{request.user.profile.display_name} commented on your post.",
            reference_id=post.id,
            metadata={'commenter_id': request.user.id, 'comment_id': comment.id},
        )

    return Response({
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at,
        'author_id': comment.author.id,
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_notify(request, post_id):
    """
    Called by the frontend after a successful like (Supabase already wrote the row).
    Only job: create a POST_LIKE notification for the post author.
    The like data itself is managed by Supabase direct writes.
    """
    post = get_object_or_404(Post, id=post_id)

    if post.author == request.user:
        return Response({'status': 'skipped'})

    try:
        already_notified = Notification.objects.filter(
            user=post.author,
            notification_type='POST_LIKE',
            reference_id=post.id,
            metadata__contains={'liker_id': request.user.id},
        ).exists()
        if not already_notified:
            Notification.objects.create(
                user=post.author,
                notification_type='POST_LIKE',
                message=f"{request.user.profile.display_name} liked your post.",
                reference_id=post.id,
                metadata={'liker_id': request.user.id},
            )
    except Exception:
        pass

    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def invite_to_jam(request, jam_id):
    """Jam admin invites a user to join their jam. Sends a JAM_INVITE notification."""
    jam = get_object_or_404(Jam, id=jam_id, admin=request.user)
    target_user_id = request.data.get('user_id')
    if not target_user_id:
        return Response({'error': 'user_id is required'}, status=400)

    target_user = get_object_or_404(User, id=target_user_id)

    if target_user == request.user:
        return Response({'error': 'Cannot invite yourself'}, status=400)

    # Deduplicate: only one pending invite notification per (jam, target)
    already_invited = Notification.objects.filter(
        user=target_user,
        notification_type='JAM_INVITE',
        reference_id=jam.id,
    ).exists()

    if not already_invited:
        Notification.objects.create(
            user=target_user,
            notification_type='JAM_INVITE',
            message=f"{request.user.profile.display_name} invited you to join {jam.name}.",
            reference_id=jam.id,
            metadata={'inviter_id': request.user.id, 'jam_name': jam.name},
        )

    return Response({'status': 'Invited'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_jam(request):
    data = request.data
    location_wkt = data.get('location')
    jam_location = GEOSGeometry(location_wkt) if location_wkt else None
    
    jam = Jam.objects.create(
        admin=request.user,
        name=data.get('name'),
        date_time=data.get('date_time'),
        end_time=data.get('end_time'),  # Added end_time
        location=jam_location,
        location_name=data.get('location_name'),
        location_address=data.get('location_address'),
        location_guide=data.get('location_guide'),
        description=data.get('description', ''),
        jam_type=data.get('jam_type', 'OPEN JAM'),
        skill_level=data.get('skill_level', 'ALL LEVELS'),
        access=str(data.get('access')).lower() == 'true',
        cover_image=request.FILES.get('cover_image')
    )
    jam.users_attending.add(request.user)
    
    chat_room = Conversation.objects.create(jam=jam)
    chat_room.participants.add(request.user)
    
    def set_m2m(field_name, manager):
        items = data.getlist(field_name) if hasattr(data, 'getlist') else data.get(field_name, [])
        if items and items != [''] and items != "":
            valid_ids = [int(i) for i in items if str(i).isdigit()]
            manager.set(valid_ids)

    set_m2m('genre_ids', jam.genre)
    set_m2m('vibe_ids', jam.vibe)
    set_m2m('instruments_needed_ids', jam.instruments_needed)
    set_m2m('roles_needed_ids', jam.roles_needed)
    set_m2m('gear_provided_ids', jam.gear_provided)
    set_m2m('gear_needed_ids', jam.gear_needed)
    
    return Response({'status': 'Jam created successfully', 'jam_id': jam.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_band(request):
    data = request.data
    
    band = Band.objects.create(
        admin=request.user,
        name=data.get('name'),
        description=data.get('description', '')
    )
    band.members.add(request.user)
    
    chat_room = Conversation.objects.create(band=band)
    chat_room.participants.add(request.user)
    
    genre_ids = data.getlist('genre_ids') if hasattr(data, 'getlist') else data.get('genre_ids', [])
    if genre_ids and genre_ids != [''] and genre_ids != "":
        valid_ids = [int(i) for i in genre_ids if str(i).isdigit()]
        band.genres.set(valid_ids)
        
    return Response({'status': 'Band created successfully', 'band_id': band.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_show(request):
    data = request.data
    location_wkt = data.get('location')
    show_location = GEOSGeometry(location_wkt) if location_wkt else None
    
    lineup_data = None
    raw_lineup = data.get('lineup')
    if raw_lineup:
        try:
            lineup_data = json.loads(raw_lineup)
        except json.JSONDecodeError:
            pass
            
    show = Show.objects.create(
        admin=request.user,
        name=data.get('name'),
        date_time=data.get('date_time'),
        end_time=data.get('end_time'),
        location=show_location,
        location_name=data.get('location_name'),
        location_address=data.get('location_address'),
        location_guide=data.get('location_guide'),
        description=data.get('description', ''),
        ticket_link=data.get('ticket_link', ''),
        ticket_price=data.get('ticket_price') or None,
        max_capacity=data.get('max_capacity') or None,
        access=str(data.get('access', 'true')).lower() == 'true',
        lineup=lineup_data,
        cover_image=request.FILES.get('cover_image')
    )
    show.users_attending.add(request.user)

    chat_room = Conversation.objects.create(show=show)
    chat_room.participants.add(request.user)
    
    genre_ids = data.getlist('genre_ids') if hasattr(data, 'getlist') else data.get('genre_ids', [])
    if genre_ids and genre_ids != [''] and genre_ids != "":
        valid_ids = [int(i) for i in genre_ids if str(i).isdigit()]
        show.genres.set(valid_ids)
        
    return Response({'status': 'Show created successfully', 'show_id': show.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def send_friend_request(request):
    target_user_id = request.data.get('target_user_id')
    target_user = get_object_or_404(User, id=target_user_id)

    if request.user == target_user:
        return Response({'error': 'Cannot add yourself'}, status=400)

    fr, created = FriendRequest.objects.get_or_create(from_user=request.user, to_user=target_user)
    
    if created:
        Notification.objects.create(
            user=target_user,
            notification_type='FRIEND_REQUEST',
            message=f"{request.user.profile.display_name} sent you a friend request.",
            reference_id=fr.id,
            metadata={'sender_id': request.user.id}
        )
    return Response({'status': 'Request sent'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def handle_friend_request(request, request_id):
    action = request.data.get('action') 
    fr = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)

    if action == 'ACCEPT':
        request.user.profile.friends.add(fr.from_user)
        fr.from_user.profile.friends.add(request.user)
        
        Notification.objects.create(
            user=fr.from_user,
            notification_type='FRIEND_ACCEPTED',
            message=f"{request.user.profile.display_name} accepted your friend request.",
            metadata={'accepter_id': request.user.id}
        )
        fr.status = 'ACCEPTED'
        fr.save()

        dm_room = Conversation.objects.create()
        dm_room.participants.add(request.user, fr.from_user)
        
        return Response({'status': 'Accepted'})
    elif action == 'DENY':
        fr.delete()
        return Response({'status': 'Denied and deleted'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def apply_for_bandmate(request, listing_id):
    listing = get_object_or_404(BandmateListing, id=listing_id)
    message = request.data.get('message', '')

    candidate, created = BandmateCandidate.objects.get_or_create(
        listing=listing, 
        user=request.user,
        defaults={'message': message}
    )

    if created:
        Notification.objects.create(
            user=listing.admin,
            notification_type='BAND_CANDIDATE',
            message=f"{request.user.profile.display_name} applied for your {listing.instrument_needed.name} opening.",
            reference_id=candidate.id,
            metadata={'applicant_id': request.user.id, 'listing_id': listing.id}
        )
    return Response({'status': 'Application submitted'})