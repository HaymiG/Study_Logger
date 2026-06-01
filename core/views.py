import json
from datetime import timedelta

from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST, require_http_methods

from .forms import TaskForm, ProfileForm, RegisterForm
from .models import Task, Profile




@login_required
def dashboard_view(request):
    return render(request, 'dashboard.html')


@login_required
def tasks_view(request):
    form = TaskForm()
    return render(request, 'tasks.html', {'form': form})


@login_required
def profile_view(request):
    profile = request.user.profile
    form = ProfileForm(initial={
        'name': request.user.get_full_name() or request.user.username,
        'email': request.user.email,
        'daily_goal': profile.daily_goal,
    })
    return render(request, 'profile.html', {'form': form})




def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    error = None
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.POST.get('next', request.GET.get('next', '/'))
            return redirect(next_url)
        else:
            error = 'Invalid username or password.'
    return render(request, 'login.html', {'error': error})


def logout_view(request):
    logout(request)
    return redirect('login')




@login_required
def api_tasks(request):
    """GET: list tasks (with optional ?filter=category). POST: create task."""
    if request.method == 'POST':
        data = json.loads(request.body)
        form = TaskForm(data)
        if form.is_valid():
            task = form.save(commit=False)
            task.user = request.user
            task.save()
            return JsonResponse({
                'status': 'ok',
                'task': _task_to_dict(task),
            }, status=201)
        return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)

    # GET
    category = request.GET.get('filter', 'all')
    qs = Task.objects.filter(user=request.user)
    if category and category != 'all':
        qs = qs.filter(category=category)

    # Sort: incomplete first, then by date desc
    qs = qs.order_by('completed', '-created_at')

    tasks_list = [_task_to_dict(t) for t in qs]
    return JsonResponse({'tasks': tasks_list})


@login_required
@require_POST
def api_task_toggle(request, task_id):
    """Toggle task completion."""
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.completed = not task.completed
    task.save()
    return JsonResponse({
        'status': 'ok',
        'completed': task.completed,
    })


@login_required
@require_http_methods(["DELETE"])
def api_task_delete(request, task_id):
    """Delete a task."""
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.delete()
    return JsonResponse({'status': 'ok'})


@login_required
def api_dashboard(request):
    """Return all dashboard stats as JSON."""
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    user_tasks = Task.objects.filter(user=request.user)
    today_tasks = user_tasks.filter(created_at__gte=today_start)

    # Stats
    today_all = list(today_tasks)
    completed_today = [t for t in today_all if t.completed]
    total_minutes_today = sum(t.duration for t in today_all)
    completion_pct = round((len(completed_today) / len(today_all) * 100)) if today_all else 0

    # Streak
    streak = 0
    for i in range(365):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_completed = user_tasks.filter(
            created_at__gte=day_start,
            created_at__lt=day_end,
            completed=True,
        ).exists()
        if day_completed:
            streak += 1
        elif i > 0:
            break

    # Weekly chart data (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_tasks = user_tasks.filter(created_at__gte=day_start, created_at__lt=day_end)
        total_min = sum(t.duration for t in day_tasks)
        weekly.append({
            'label': day.strftime('%a'),
            'hours': round(total_min / 60, 2),
        })

    # Category counts (all time, for pie chart)
    category_counts = {}
    for t in user_tasks:
        category_counts[t.category] = category_counts.get(t.category, 0) + 1

    # Category progress today
    category_progress = {}
    for t in today_all:
        if t.category not in category_progress:
            category_progress[t.category] = {'total': 0, 'completed': 0}
        category_progress[t.category]['total'] += 1
        if t.completed:
            category_progress[t.category]['completed'] += 1

    # Profile info
    profile = request.user.profile
    daily_goal = profile.daily_goal
    goal_pct = min(round((len(completed_today) / daily_goal) * 100), 100) if daily_goal else 0

    return JsonResponse({
        'tasksToday': len(completed_today),
        'streak': streak,
        'hoursToday': round(total_minutes_today / 60, 1),
        'completionPct': completion_pct,
        'weekly': weekly,
        'categoryCounts': category_counts,
        'categoryProgress': category_progress,
        'dailyGoal': daily_goal,
        'goalPct': goal_pct,
        'completedToday': len(completed_today),
    })


@login_required
@require_POST
def api_profile(request):
    """Update user profile."""
    data = json.loads(request.body)
    form = ProfileForm(data)
    if form.is_valid():
        user = request.user
        full_name = form.cleaned_data['name']
        parts = full_name.split(' ', 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ''
        user.email = form.cleaned_data['email']
        user.save()

        profile = user.profile
        profile.daily_goal = form.cleaned_data['daily_goal']
        profile.save()

        return JsonResponse({
            'status': 'ok',
            'name': full_name,
            'email': user.email,
            'dailyGoal': profile.daily_goal,
        })
    return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)


@login_required
@require_POST
def api_theme(request):
    """Update theme preference."""
    data = json.loads(request.body)
    theme = data.get('theme', 'light')
    profile = request.user.profile
    profile.theme = theme
    profile.save()
    return JsonResponse({'status': 'ok', 'theme': theme})


@login_required
def api_profile_info(request):
    """GET profile info for rendering."""
    user = request.user
    profile = user.profile
    name = user.get_full_name() or user.username
    total_tasks = Task.objects.filter(user=user, completed=True).count()
    total_minutes = sum(t.duration for t in Task.objects.filter(user=user))

    # Best streak
    now = timezone.now()
    streak = 0
    for i in range(365):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_completed = Task.objects.filter(
            user=user,
            created_at__gte=day_start,
            created_at__lt=day_end,
            completed=True,
        ).exists()
        if day_completed:
            streak += 1
        elif i > 0:
            break

    return JsonResponse({
        'name': name,
        'email': user.email,
        'dailyGoal': profile.daily_goal,
        'theme': profile.theme,
        'totalTasks': total_tasks,
        'totalHours': round(total_minutes / 60),
        'bestStreak': streak,
    })



def _task_to_dict(task):
    return {
        'id': task.id,
        'name': task.name,
        'category': task.category,
        'duration': task.duration,
        'notes': task.notes,
        'completed': task.completed,
        'createdAt': task.created_at.isoformat(),
    }
