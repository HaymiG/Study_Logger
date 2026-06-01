from django.urls import path
from . import views

urlpatterns = [
    # Pages
    path('', views.dashboard_view, name='dashboard'),
    path('tasks/', views.tasks_view, name='tasks'),
    path('profile/', views.profile_view, name='profile'),

    # Auth
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # API
    path('api/tasks/', views.api_tasks, name='api_tasks'),
    path('api/tasks/<int:task_id>/toggle/', views.api_task_toggle, name='api_task_toggle'),
    path('api/tasks/<int:task_id>/', views.api_task_delete, name='api_task_delete'),
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),
    path('api/profile/', views.api_profile, name='api_profile'),
    path('api/profile/info/', views.api_profile_info, name='api_profile_info'),
    path('api/theme/', views.api_theme, name='api_theme'),
]
