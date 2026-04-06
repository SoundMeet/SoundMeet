from django.contrib.gis.db import models
from django.contrib.auth.models import User
import uuid

class Instrument(models.Model):
    class families(models.TextChoices):
        STRINGS = 'STRINGS'
        WOODWINDS = 'WOODWINDS'
        BRASS = 'BRASS'
        PERCUSSION = 'PERCUSSION'
        NULL = 'NULL'
        
    name = models.CharField(max_length=100, unique=True)
    family = models.CharField(choices=families.choices, default=families.NULL)

    def __str__(self):
        return self.name

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Vibe(models.Model):
    name = models.CharField(blank=True, max_length=100, unique=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Gear(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Artist(models.Model):
    name = models.CharField(blank=True, max_length=100)
    picture = models.URLField(blank=True, null=True)
    genre = models.ManyToManyField(Genre)

    def __str__(self):
        return self.name

class Profile(models.Model):
    class genders(models.TextChoices):
        MAN = 'MAN'
        WOMAN = 'WOMAN'
        NONBINARY = 'NON-BINARY'
        PREFERNOTTOSAY = 'PREFER NOT TO SAY'

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=15, blank=True)
    pfp = models.ImageField(upload_to='pfp_images/',blank=True, null=True)
    about = models.TextField(max_length=500, blank=True, null=True)
    
    # MetaData
    location = models.PointField(geography=True, srid=4326, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=100, choices=genders.choices, blank=True)
    spectator = models.BooleanField(default=False)

    # Music links
    spotify = models.URLField(blank=True, null=True)
    soundcloud = models.URLField(blank=True, null=True)
    bandcamp = models.URLField(blank=True, null=True)
    youtube = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    tiktok = models.URLField(blank=True, null=True)

    # Relationships
    instruments_liked = models.ManyToManyField(Instrument, related_name="profiles", blank=True)
    genres_liked = models.ManyToManyField(Genre, related_name="profiles", blank=True)
    vibes_liked = models.ManyToManyField(Vibe, related_name="profiles", blank=True)
    friends = models.ManyToManyField(User, blank=True, related_name="friends_of")

    @property
    def friends_count(self):
        return self.friends.count()

    def __str__(self):
        return self.user.username

class Jam(models.Model):
    class JamTypes(models.TextChoices):
        OPEN_JAM = 'OPEN JAM'
        BAND_PRACTICE = 'BAND PRACTICE'
        SONGWRITING = 'SONGWRITING SESSION'
        RECORDING = 'RECORDING SESSION'
        LIVE_PERFORMANCE = 'LIVE PERFORMANCE'
        WORKSHOP = 'WORKSHOP'

    class SkillLevels(models.TextChoices):
        BEGINNER = 'BEGINNER'
        INTERMEDIATE = 'INTERMEDIATE'
        ADVANCED = 'ADVANCED'
        PROFESSIONAL = 'PROFESSIONAL'
        ALL_LEVELS = 'ALL LEVELS'

    name = models.CharField(max_length=100)
    location = models.PointField(geography=True, srid=4326, blank=True, null=True)
    date_time = models.DateTimeField()
    description = models.TextField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='jam_images/', blank=True, null=True)
    
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_jams")
    jam_type = models.CharField(max_length=50, choices=JamTypes.choices, default=JamTypes.OPEN_JAM)
    skill_level = models.CharField(max_length=50, choices=SkillLevels.choices, default=SkillLevels.ALL_LEVELS)
    access = models.BooleanField(default=False, help_text="True means public, False means private")
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    users_attending = models.ManyToManyField(User, blank=True, related_name="attending_jams")
    spectators = models.ManyToManyField(User, blank=True, related_name="spectating_jams")
    
    genre = models.ManyToManyField(Genre, blank=True)
    vibe = models.ManyToManyField(Vibe, blank=True)
    
    instruments_needed = models.ManyToManyField(Instrument, blank=True, related_name="jams_needing_instrument")
    roles_needed = models.ManyToManyField(Role, blank=True, related_name="jams_needing_role")
    
    gear_provided = models.ManyToManyField(Gear, blank=True, related_name="jams_providing_gear")
    gear_needed = models.ManyToManyField(Gear, blank=True, related_name="jams_needing_gear")

    def __str__(self):
        return self.name

class Show(models.Model):
    name = models.CharField(max_length=150)
    date_time = models.DateTimeField()
    location = models.PointField(geography=True, srid=4326, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_shows")
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True)
    ticket_link = models.URLField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='show_images/', blank=True, null=True)
    users_attending = models.ManyToManyField(User, blank=True, related_name="attending_shows")

    def __str__(self):
        return self.name

class Band(models.Model):
    name = models.CharField(max_length=100)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_bands")
    members = models.ManyToManyField(User, related_name="bands")
    genres = models.ManyToManyField(Genre, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class BandmateListing(models.Model):
    class Statuses(models.TextChoices):
        OPEN = 'OPEN'
        FILLED = 'FILLED'
        CLOSED = 'CLOSED'

    title = models.CharField(max_length=150)
    band = models.ForeignKey(Band, on_delete=models.CASCADE, null=True, blank=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bandmate_listings")
    instrument_needed = models.ForeignKey(Instrument, on_delete=models.CASCADE)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=Statuses.choices, default=Statuses.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class BandmateCandidate(models.Model):
    class CandidateStatuses(models.TextChoices):
        PENDING = 'PENDING'
        ACCEPTED = 'ACCEPTED'
        REJECTED = 'REJECTED'

    listing = models.ForeignKey(BandmateListing, on_delete=models.CASCADE, related_name="candidates")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bandmate_applications")
    status = models.CharField(max_length=10, choices=CandidateStatuses.choices, default=CandidateStatuses.PENDING)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('listing', 'user')

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jam = models.ForeignKey(Jam, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_rooms")
    band = models.ForeignKey(Band, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_rooms")
    show = models.ForeignKey(Show, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_rooms")
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.jam: return f"Jam Chat: {self.jam.name}"
        if self.band: return f"Band Chat: {self.band.name}"
        if self.show: return f"Show Chat: {self.show.name}"
        return f"DM: {self.id}"

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}..."
    
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(max_length=1000, blank=True, null=True)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_comments")
    content = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on Post {self.post.id}"

class FriendRequest(models.Model):
    class RequestStatuses(models.TextChoices):
        PENDING = 'PENDING'
        ACCEPTED = 'ACCEPTED'
        DENIED = 'DENIED'

    from_user = models.ForeignKey(User, related_name='sent_friend_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_friend_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=RequestStatuses.choices, default=RequestStatuses.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

class Notification(models.Model):
    class NotificationTypes(models.TextChoices):
        FRIEND_REQUEST = 'FRIEND_REQUEST'
        FRIEND_ACCEPTED = 'FRIEND_ACCEPTED'
        SHOW_REMINDER = 'SHOW_REMINDER'
        BAND_CANDIDATE = 'BAND_CANDIDATE'
        BAND_UPDATE = 'BAND_UPDATE'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=NotificationTypes.choices)
    message = models.CharField(max_length=255)
    
    reference_id = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.notification_type} for {self.user.username}"