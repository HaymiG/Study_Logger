from django.contrib import admin
from .models import Task, Profile


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'category', 'duration', 'completed', 'created_at']
    list_filter = ['category', 'completed', 'created_at']
    search_fields = ['name', 'notes']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'daily_goal', 'theme']
