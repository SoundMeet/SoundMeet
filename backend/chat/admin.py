from django.contrib import admin
from .models import Profile, Jam, Role, Gear, Notification, FriendRequest, Band, Show

# Register your models here.
admin.site.register(Profile)
admin.site.register(Jam)
admin.site.register(Role)
admin.site.register(Gear)
admin.site.register(Notification)
admin.site.register(FriendRequest)
admin.site.register(Band)
admin.site.register(Show)