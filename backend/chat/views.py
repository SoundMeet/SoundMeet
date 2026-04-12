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
    BandmateListing, BandmateCandidate, Jam, Show, Genre, Band, Conversation,
    Artist, Instrument, Vibe, MusicSnip
)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    age = request.data.get('age')
    country = request.data.get('country', '')
    city = request.data.get('city', '')
    gender = request.data.get('gender', '')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)

    profile = Profile.objects.create(
        user=user,
        display_name=username[:15],
        country=country,
        city=city,
        gender=gender,
    )
    if age:
        profile.age = int(age)
        profile.save()

    token = Token.objects.create(user=user)

    return Response({
        'token': token.key,
        'user_id': user.id,
        'username': user.username,
    })

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def music_snips(request):
    
    if request.method == 'GET':
        profile_id = request.query_params.get('profile_id')
        
        if not profile_id:
            return Response({'error': 'profile_id is required.'}, status=400)
            
        snips = MusicSnip.objects.filter(profile_id=profile_id)
        
        snips_data = [
            {
                'id': snip.id,
                'name': snip.name,
                'musicFile': snip.musicFile.url if snip.musicFile else None
            }
            for snip in snips
        ]
        return Response({'snips': snips_data}, status=200)
    
    elif request.method == 'POST':
        name = request.data.get('name', 'Untitled Snip')
        music_file = request.FILES.get('musicFile')

        if not music_file:
            return Response({'error': 'An audio file is required to create a snip.'}, status=400)

        snip = MusicSnip.objects.create(
            profile=request.user.profile,
            name=name,
            musicFile=music_file
        )

        return Response({
            'status': 'Snip created successfully',
            'snip': {
                'id': snip.id,
                'name': snip.name,
                'musicFile': snip.musicFile.url if snip.musicFile else None
            }
        }, status=201)

    elif request.method == 'PATCH':
        snip_id = request.data.get('snip_id')
        
        if not snip_id:
            return Response({'error': 'snip_id is required.'}, status=400)

        snip = get_object_or_404(MusicSnip, id=snip_id, profile__user=request.user)

        if 'name' in request.data:
            snip.name = request.data['name']
        if 'musicFile' in request.FILES:
            snip.musicFile = request.FILES['musicFile']

        snip.save()

        return Response({
            'status': 'Snip updated successfully',
            'snip': {
                'id': snip.id,
                'name': snip.name,
                'musicFile': snip.musicFile.url if snip.musicFile else None
            }
        }, status=200)

    elif request.method == 'DELETE':
        snip_id = request.data.get('snip_id') or request.query_params.get('snip_id')
        
        if not snip_id:
            return Response({'error': 'snip_id is required.'}, status=400)

        snip = get_object_or_404(MusicSnip, id=snip_id, profile__user=request.user)
        snip.delete()
        
        return Response({'status': 'Music snip deleted successfully.'}, status=204)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile, created = Profile.objects.get_or_create(
        user=request.user,
        defaults={'display_name': request.user.username[:15]}
    )

    # Auto-mark existing users as onboarded if they already have preferences.
    # Does NOT mark based on display_name alone — that would mark new users too.
    if not profile.onboarding_complete:
        if profile.genres_liked.exists() or profile.instruments_liked.exists():
            profile.onboarding_complete = True
            profile.save()

    if request.method == 'PATCH':
        data = request.data

        if 'display_name' in data:
            profile.display_name = data['display_name'][:15]
        if 'about' in data:
            profile.about = data['about']
        if 'country' in data:
            profile.country = data['country']
        if 'city' in data:
            profile.city = data['city']
        if 'state' in data:
            profile.state = data['state']
        if 'gender' in data:
            profile.gender = data['gender']
        if 'spectator' in data:
            val = data['spectator']
            profile.spectator = val if isinstance(val, bool) else str(val).lower() == 'true'
        if 'age' in data:
            profile.age = int(data['age']) if data['age'] else None
        if 'skill_level' in data:
            profile.skill_level = data['skill_level']
        if 'onboarding_complete' in data:
            val = data['onboarding_complete']
            profile.onboarding_complete = val if isinstance(val, bool) else str(val).lower() == 'true'

        # Music links
        if 'spotify' in data:
            profile.spotify = data['spotify'] or None
        if 'soundcloud' in data:
            profile.soundcloud = data['soundcloud'] or None
        if 'bandcamp' in data:
            profile.bandcamp = data['bandcamp'] or None
        if 'youtube' in data:
            profile.youtube = data['youtube'] or None
        if 'instagram' in data:
            profile.instagram = data['instagram'] or None
        if 'tiktok' in data:
            profile.tiktok = data['tiktok'] or None

        if 'pfp' in request.FILES:
            profile.pfp = request.FILES['pfp']
        
        if 'profile_banner' in request.FILES:
            profile.profile_banner = request.FILES['profile_banner']

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
        update_m2m('artists_liked', profile.artists_liked)

        profile.refresh_from_db()

    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'display_name': profile.display_name,
        'about': profile.about,
        'spectator': profile.spectator,
        'onboarding_complete': profile.onboarding_complete,
        'skill_level': profile.skill_level,
        'pfp': profile.pfp.url if profile.pfp else None,
        'profile_banner': profile.profile_banner.url if profile.profile_banner else None,
        'country': profile.country,
        'city': profile.city,
        'state': profile.state,
        'age': profile.age,
        'gender': profile.gender,
        'spotify': profile.spotify,
        'soundcloud': profile.soundcloud,
        'bandcamp': profile.bandcamp,
        'youtube': profile.youtube,
        'instagram': profile.instagram,
        'tiktok': profile.tiktok,
        'instruments_liked': list(profile.instruments_liked.values('id', 'name', 'family')),
        'genres_liked': list(profile.genres_liked.values('id', 'name')),
        'vibes_liked': list(profile.vibes_liked.values('id', 'name')),
        'artists_liked': list(profile.artists_liked.values('id', 'name', 'picture')),
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def update_jam(request, jam_id):
    jam = get_object_or_404(Jam, id=jam_id, admin=request.user)
    data = request.data

    if 'name' in data:          jam.name = data['name']
    if 'date_time' in data:     jam.date_time = data['date_time'] or None
    if 'end_time' in data:      jam.end_time = data['end_time'] or None
    if 'location' in data:
        wkt = data.get('location')
        jam.location = GEOSGeometry(wkt) if wkt else None
    if 'location_name' in data:    jam.location_name = data['location_name']
    if 'location_address' in data: jam.location_address = data['location_address']
    if 'location_guide' in data:   jam.location_guide = data['location_guide'] or None
    if 'description' in data:      jam.description = data['description']
    if 'jam_type' in data:         jam.jam_type = data['jam_type']
    if 'skill_level' in data:      jam.skill_level = data['skill_level']
    if 'access' in data:           jam.access = str(data['access']).lower() == 'true'
    if 'max_attendees' in data:    jam.max_attendees = data['max_attendees'] or None
    if 'cover_image' in request.FILES: jam.cover_image = request.FILES['cover_image']

    jam.save()

    def set_m2m(field_name, manager):
        items = data.getlist(field_name) if hasattr(data, 'getlist') else data.get(field_name, [])
        valid_ids = [int(i) for i in (items or []) if str(i).isdigit()]
        manager.set(valid_ids)

    set_m2m('genre_ids', jam.genre)
    set_m2m('vibe_ids', jam.vibe)
    set_m2m('instruments_needed_ids', jam.instruments_needed)
    set_m2m('roles_needed_ids', jam.roles_needed)
    set_m2m('gear_provided_ids', jam.gear_provided)
    set_m2m('gear_needed_ids', jam.gear_needed)

    return Response({'status': 'Jam updated successfully'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_jam(request, jam_id):
    jam = get_object_or_404(Jam, id=jam_id, admin=request.user)
    jam.delete()
    return Response({'status': 'Jam deleted'}, status=204)


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
        end_time=data.get('end_time'),
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def update_show(request, show_id):
    show = get_object_or_404(Show, id=show_id, admin=request.user)
    data = request.data

    if 'name' in data:          show.name = data['name']
    if 'date_time' in data:     show.date_time = data['date_time'] or None
    if 'end_time' in data:      show.end_time = data['end_time'] or None
    if 'location' in data:
        wkt = data.get('location')
        show.location = GEOSGeometry(wkt) if wkt else None
    if 'location_name' in data:    show.location_name = data['location_name']
    if 'location_address' in data: show.location_address = data['location_address']
    if 'location_guide' in data:   show.location_guide = data['location_guide'] or None
    if 'description' in data:      show.description = data['description']
    if 'ticket_link' in data:      show.ticket_link = data['ticket_link'] or None
    if 'ticket_price' in data:     show.ticket_price = data['ticket_price'] or None
    if 'max_capacity' in data:     show.max_capacity = data['max_capacity'] or None
    if 'access' in data:           show.access = str(data['access']).lower() == 'true'
    if 'cover_image' in request.FILES: show.cover_image = request.FILES['cover_image']

    raw_lineup = data.get('lineup')
    if raw_lineup is not None:
        try:
            show.lineup = json.loads(raw_lineup)
        except (json.JSONDecodeError, TypeError):
            show.lineup = []

    show.save()

    genre_ids = data.getlist('genre_ids') if hasattr(data, 'getlist') else data.get('genre_ids', [])
    valid_genre_ids = [int(i) for i in (genre_ids or []) if str(i).isdigit()]
    show.genres.set(valid_genre_ids)

    return Response({'status': 'Show updated successfully'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_show(request, show_id):
    show = get_object_or_404(Show, id=show_id, admin=request.user)
    show.delete()
    return Response({'status': 'Show deleted'}, status=204)


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
def cancel_friend_request(request, request_id):
    fr = get_object_or_404(FriendRequest, id=request_id, from_user=request.user, status='PENDING')
    # Remove the FRIEND_REQUEST notification from the recipient's feed
    Notification.objects.filter(
        notification_type='FRIEND_REQUEST',
        reference_id=fr.id,
        user=fr.to_user,
    ).delete()
    fr.delete()
    return Response({'status': 'Cancelled'})


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