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

class Artist(models.Model):
    name = models.CharField(blank=True, max_length=100)
    picture = models.URLField(blank=True, null=True)
    genre = models.ManyToManyField(Genre)

    def __str__(self):
        return self.name

class Vibe(models.Model):
    name = models.CharField(blank=True, max_length=100, unique=True)

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
    pfp = models.ImageField(blank=True, null=True)
    about = models.TextField(max_length=500, blank=True, null=True)
    
    # MetaData
    location = models.PointField(geography=True, srid=4326, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=100, choices=genders.choices, blank=True)
    spectator = models.BooleanField(default=False)

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
    name = models.CharField(max_length=100)
    location = models.PointField(geography=True, srid=4326, blank=True, null=True)
    date_time = models.DateTimeField()
    description = models.TextField(blank=True, null=True)
    
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_jams")
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True)
    vibe = models.ForeignKey(Vibe, on_delete=models.SET_NULL, null=True)
    
    users_attending = models.ManyToManyField(User, blank=True, related_name="attending_jams")
    spectators = models.ManyToManyField(User, blank=True, related_name="spectating_jams")
    roles_needed = models.ManyToManyField(Instrument, blank=True)
    access = models.BooleanField(default=False, help_text="True means public, False means private")

    def __str__(self):
        return self.name

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # If this is linked to a Jam, it's a Jam Group Chat. If null, it's a DM.
    jam = models.ForeignKey(Jam, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_rooms")
    
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.jam:
            return f"Jam Chat: {self.jam.name}"
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