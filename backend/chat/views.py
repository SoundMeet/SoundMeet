import random
import os
import resend
import requests as http_requests
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import EmailVerification, PasswordResetCode
from django.shortcuts import render, get_object_or_404
from django.core.files.storage import default_storage
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry
from django.db import transaction
from django.db.models import Avg, Count
from .models import (
    Profile, Post, Comment, FriendRequest, Notification,
    BandmateListing, BandmateCandidate, Jam, JamRating, Show, Genre, Band, Conversation,
    ConversationParticipant, Artist, Instrument, Vibe, MusicSnip
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
            
        snips = MusicSnip.objects.filter(profile__user_id=profile_id)
        
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
        elif data.get('clear_profile_banner') == 'true':
            profile.profile_banner.delete(save=False)
            profile.profile_banner = None

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
        'email': request.user.email,
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
        'has_usable_password': request.user.has_usable_password(),
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if post.author != request.user:
        return Response({'error': 'You can only edit your own posts.'}, status=403)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Content cannot be empty.'}, status=400)

    post.content = content
    post.save(update_fields=['content', 'updated_at'])
    return Response({'id': post.id, 'content': post.content, 'updated_at': post.updated_at})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_post(request):
    content   = request.data.get('content', '')
    image     = request.FILES.get('image', None)
    post_type = request.data.get('post_type', 'text')

    if post_type == 'review':
        jam_id = request.data.get('jam_id')
        raw_rating = request.data.get('rating')

        if not jam_id or not raw_rating:
            return Response({'error': 'jam_id and rating are required for review posts.'}, status=400)

        try:
            rating_value = int(raw_rating)
            if not (1 <= rating_value <= 5):
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'error': 'rating must be an integer between 1 and 5.'}, status=400)

        jam = get_object_or_404(Jam, id=jam_id)

        if jam.date_time > timezone.now():
            return Response({'error': 'Cannot review a future jam.'}, status=400)

        attended = jam.users_attending.filter(id=request.user.id).exists()
        is_admin = jam.admin_id == request.user.id
        if not attended and not is_admin:
            return Response({'error': 'You did not attend this jam.'}, status=403)

        comment = (content or '').strip()[:280]
        jr, _ = JamRating.objects.update_or_create(
            jam=jam,
            user=request.user,
            defaults={'rating': rating_value, 'comment': comment},
        )

        post = Post.objects.create(
            author=request.user,
            content=content,
            post_type='review',
            jam_rating=jr,
        )

        # Notify host (skip self-rating); one notification per rater per jam
        if jam.admin_id != request.user.id:
            Notification.objects.create(
                user=jam.admin,
                notification_type=Notification.NotificationTypes.JAM_RATED,
                reference_id=jam.id,
                message=f"{request.user.profile.display_name} rated your jam {jam.name} {rating_value}★.",
                metadata={'rater_id': request.user.id, 'rating': rating_value, 'jam_name': jam.name},
            )
    else:
        if not content and not image:
            return Response({'error': 'Post must contain text or an image.'}, status=400)

        post = Post.objects.create(
            author=request.user,
            content=content,
            image=image,
            post_type=post_type,
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
def join_jam_chat(request, jam_id):
    """Add the authenticated user to the jam's chat conversation."""
    jam = get_object_or_404(Jam, id=jam_id)
    conversation = Conversation.objects.filter(jam=jam).first()
    if not conversation:
        return Response({'error': 'No chat room exists for this jam.'}, status=404)

    participant, created = ConversationParticipant.objects.get_or_create(
        conversation=conversation,
        user=request.user,
        defaults={'left_at': None},
    )
    if not created and participant.left_at is not None:
        participant.left_at = None
        participant.save(update_fields=['left_at'])

    return Response({'conversation_id': str(conversation.id)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_jam(request, jam_id):
    """Submit or update a star rating (1–5) for a past jam the user attended."""
    jam = get_object_or_404(Jam, id=jam_id)

    if jam.date_time > timezone.now():
        return Response({'error': 'Cannot rate a future jam.'}, status=400)

    attended = jam.users_attending.filter(id=request.user.id).exists()
    is_admin = jam.admin_id == request.user.id
    if not attended and not is_admin:
        return Response({'error': 'You did not attend this jam.'}, status=403)

    raw_rating = request.data.get('rating')
    try:
        rating_value = int(raw_rating)
        if not (1 <= rating_value <= 5):
            raise ValueError()
    except (TypeError, ValueError):
        return Response({'error': 'rating must be an integer between 1 and 5.'}, status=400)

    raw_comment = request.data.get('comment')
    defaults = {'rating': rating_value}
    if raw_comment is not None:
        defaults['comment'] = raw_comment.strip()[:280]

    jr, _ = JamRating.objects.update_or_create(
        jam=jam,
        user=request.user,
        defaults=defaults,
    )
    comment = jr.comment

    # Notify host (skip self-rating); one notification per rater per jam
    if jam.admin_id != request.user.id:
        Notification.objects.create(
            user=jam.admin,
            notification_type=Notification.NotificationTypes.JAM_RATED,
            reference_id=jam.id,
            message=f"{request.user.profile.display_name} rated your jam {jam.name} {rating_value}★.",
            metadata={'rater_id': request.user.id, 'rating': rating_value, 'jam_name': jam.name},
        )

    agg = jam.ratings.aggregate(avg=Avg('rating'), count=Count('id'))
    return Response({
        'rating': rating_value,
        'comment': comment,
        'avg_rating': round(agg['avg'], 1) if agg['avg'] else rating_value,
        'rating_count': agg['count'],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_jam_rating(request, jam_id):
    """Return the current user's existing rating for a jam, or nulls if not rated."""
    try:
        jr = JamRating.objects.get(jam_id=jam_id, user=request.user)
        return Response({'rating': jr.rating, 'comment': jr.comment})
    except JamRating.DoesNotExist:
        return Response({'rating': None, 'comment': ''})


@api_view(['GET'])
@permission_classes([AllowAny])
def jam_ratings_summary(request, jam_id):
    """Return the aggregate avg rating and count for a jam (public, no auth required)."""
    get_object_or_404(Jam, id=jam_id)
    agg = JamRating.objects.filter(jam_id=jam_id).aggregate(avg=Avg('rating'), count=Count('id'))
    return Response({
        'avg_rating': round(agg['avg'], 1) if agg['avg'] else None,
        'rating_count': agg['count'],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def bulk_jam_ratings_summary(request):
    """Return aggregate ratings for multiple jams at once.

    Body: { "jam_ids": [1, 2, 3] }
    Response: { "1": { "avg_rating": 4.2, "rating_count": 5 }, ... }
    """
    jam_ids = request.data.get('jam_ids', [])
    if not isinstance(jam_ids, list):
        return Response({'error': 'jam_ids must be a list.'}, status=400)

    rows = (
        JamRating.objects
        .filter(jam_id__in=jam_ids)
        .values('jam_id')
        .annotate(avg=Avg('rating'), count=Count('id'))
    )

    result = {}
    for row in rows:
        result[str(row['jam_id'])] = {
            'avg_rating': round(row['avg'], 1) if row['avg'] else None,
            'rating_count': row['count'],
        }

    # Include jams with no ratings so the caller gets a complete map
    for jid in jam_ids:
        if str(jid) not in result:
            result[str(jid)] = {'avg_rating': None, 'rating_count': 0}

    return Response(result)


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
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=400)

    # Generate 6-digit code
    code = str(random.randint(100000, 999999))

    # Delete any existing unused codes for this email
    EmailVerification.objects.filter(email=email, is_used=False).delete()

    # Save new code
    EmailVerification.objects.create(email=email, code=code)

    # Send email
    try:
        resend.api_key = os.environ.get('RESEND_API_KEY')
        resend.Emails.send({
            'from': 'SoundMeet <noreply@soundmeet.app>',
            'to': [email],
            'subject': 'Your SoundMeet verification code',
            'text': f'Your verification code is: {code}\n\nThis code expires in 10 minutes.',
        })
    except Exception as e:
        return Response({'error': 'Failed to send email'}, status=500)

    return Response({'status': 'Code sent'})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_code(request):
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=400)

    try:
        verification = EmailVerification.objects.filter(
            email=email,
            code=code,
            is_used=False
        ).latest('created_at')
    except EmailVerification.DoesNotExist:
        return Response({'error': 'Invalid code'}, status=400)

    if verification.is_expired():
        return Response({'error': 'Code has expired'}, status=400)

    verification.is_used = True
    verification.save()

    return Response({'status': 'verified'})
@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    access_token = request.data.get('token')
    if not access_token:
        return Response({'error': 'Token is required'}, status=400)

    # Use the access token to fetch verified user info directly from Google
    userinfo_res = http_requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=10,
    )
    if userinfo_res.status_code != 200:
        return Response({'error': 'Invalid Google token'}, status=400)

    userinfo = userinfo_res.json()
    email = userinfo.get('email')
    name = userinfo.get('name', '')

    if not email:
        return Response({'error': 'No email from Google'}, status=400)

    # Find or create the Django user by email
    try:
        user = User.objects.get(email__iexact=email)
        created = False
    except User.DoesNotExist:
        base = email.split('@')[0][:12]
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1

        user = User(username=username, email=email)
        user.set_unusable_password()
        user.save()

        Profile.objects.get_or_create(
            user=user,
            defaults={'display_name': name[:15] or username},
        )
        created = True

    auth_token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': auth_token.key,
        'user_id': user.id,
        'username': user.username,
        'created': created,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_google_signup(request):
    user = request.user
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    age = request.data.get('age')
    country = request.data.get('country', '').strip()
    city = request.data.get('city', '').strip()
    gender = request.data.get('gender', '').strip()

    if not username:
        return Response({'error': 'Username is required.'}, status=400)

    if User.objects.filter(username=username).exclude(pk=user.pk).exists():
        return Response({'error': 'Username already taken.'}, status=400)

    user.username = username
    if password:
        user.set_password(password)
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    if country:
        profile.country = country
    if city:
        profile.city = city
    if gender:
        profile.gender = gender
    if age:
        try:
            profile.age = int(age)
        except (ValueError, TypeError):
            pass
    profile.save()

    return Response({'username': user.username})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    new_password = request.data.get('new_password', '')
    confirm_new_password = request.data.get('confirm_new_password', '')

    if not new_password or not confirm_new_password:
        return Response({'error': 'New password and confirmation are required.'}, status=400)

    if new_password != confirm_new_password:
        return Response({'error': 'Passwords do not match.'}, status=400)

    if user.has_usable_password():
        current_password = request.data.get('current_password', '')
        if not current_password:
            return Response({'error': 'Current password is required.'}, status=400)
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=403)

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({'error': e.messages[0]}, status=400)

    user.set_password(new_password)
    user.save()

    Token.objects.filter(user=user).delete()
    new_token = Token.objects.create(user=user)

    return Response({'token': new_token.key})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def delete_account(request):
    user = request.user

    if user.has_usable_password():
        password = request.data.get('password', '')
        if not password:
            return Response({'error': 'Password is required.'}, status=400)
        if not user.check_password(password):
            return Response({'error': 'Incorrect password.'}, status=403)
    else:
        confirm_username = request.data.get('confirm_username', '')
        if confirm_username.strip().lower() != user.username.lower():
            return Response({'error': 'Username confirmation does not match.'}, status=403)

    # Collect S3 file paths before deletion so we can clean them up afterward.
    files_to_delete = []
    try:
        profile = user.profile
        if profile.pfp:
            files_to_delete.append(profile.pfp.name)
        if profile.profile_banner:
            files_to_delete.append(profile.profile_banner.name)
        for snip in profile.audio_snips.all():
            if snip.musicFile:
                files_to_delete.append(snip.musicFile.name)
    except Profile.DoesNotExist:
        pass

    for jam in user.admin_jams.all():
        if jam.cover_image:
            files_to_delete.append(jam.cover_image.name)
    for show in user.admin_shows.all():
        if show.cover_image:
            files_to_delete.append(show.cover_image.name)
    for post in user.posts.all():
        if post.image:
            files_to_delete.append(post.image.name)

    # DM conversations have no FK to User so CASCADE won't reach them.
    # Delete them explicitly before user.delete() so their messages go too.
    dm_conv_ids = list(
        user.conversation_memberships
            .filter(
                conversation__jam__isnull=True,
                conversation__band__isnull=True,
                conversation__show__isnull=True,
            )
            .values_list('conversation_id', flat=True)
    )
    if dm_conv_ids:
        Conversation.objects.filter(id__in=dm_conv_ids).delete()

    user.delete()

    # Delete S3 files after the DB rows are gone. Failures are non-fatal.
    def _delete_files():
        for name in files_to_delete:
            try:
                default_storage.delete(name)
            except Exception:
                pass

    transaction.on_commit(_delete_files)

    return Response({'status': 'Account deleted.'}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'error': 'Email is required.'}, status=400)

    # Always return 200 — never reveal whether the email exists
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'status': 'If that email is registered, a code has been sent.'})

    code = str(random.randint(100000, 999999))

    # Invalidate any existing unused codes for this email
    PasswordResetCode.objects.filter(email__iexact=email, is_used=False).delete()
    PasswordResetCode.objects.create(email=user.email, code=code)

    try:
        resend.api_key = os.environ.get('RESEND_API_KEY')
        resend.Emails.send({
            'from': 'SoundMeet <noreply@soundmeet.app>',
            'to': [user.email],
            'subject': 'Reset your SoundMeet password',
            'text': (
                f'Your password reset code is: {code}\n\n'
                'This code expires in 10 minutes.\n\n'
                'If you did not request a password reset, you can safely ignore this email.'
            ),
        })
    except Exception:
        return Response({'error': 'Failed to send email.'}, status=500)

    return Response({'status': 'If that email is registered, a code has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email', '').strip()
    code = request.data.get('code', '').strip()
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not all([email, code, new_password, confirm_password]):
        return Response({'error': 'All fields are required.'}, status=400)

    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match.'}, status=400)

    try:
        reset = PasswordResetCode.objects.filter(
            email__iexact=email,
            code=code,
            is_used=False,
        ).latest('created_at')
    except PasswordResetCode.DoesNotExist:
        return Response({'error': 'Invalid or expired code.'}, status=400)

    if reset.is_expired():
        return Response({'error': 'This code has expired. Please request a new one.'}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid or expired code.'}, status=400)

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({'error': e.messages[0]}, status=400)

    user.set_password(new_password)
    user.save()

    reset.is_used = True
    reset.save()

    # Invalidate all existing tokens and issue a fresh one
    Token.objects.filter(user=user).delete()
    new_token = Token.objects.create(user=user)

    return Response({
        'token': new_token.key,
        'user_id': user.id,
        'username': user.username,
    })