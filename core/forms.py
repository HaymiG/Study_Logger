from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Task, Profile


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['name', 'category', 'duration', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g. Read Chapter 5 of CLRS',
                'id': 'task-name',
            }),
            'category': forms.Select(attrs={
                'class': 'form-input form-select',
                'id': 'task-category',
            }),
            'duration': forms.NumberInput(attrs={
                'class': 'form-input',
                'placeholder': '30',
                'min': '1',
                'max': '480',
                'id': 'task-duration',
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-input form-textarea',
                'rows': 2,
                'placeholder': 'Quick notes about this task…',
                'id': 'task-notes',
            }),
        }


class ProfileForm(forms.Form):
    name = forms.CharField(max_length=150, widget=forms.TextInput(attrs={
        'class': 'form-input',
        'placeholder': 'Your Name',
        'id': 'profile-name-input',
    }))
    email = forms.EmailField(widget=forms.EmailInput(attrs={
        'class': 'form-input',
        'placeholder': 'you@example.com',
        'id': 'profile-email-input',
    }))
    daily_goal = forms.IntegerField(min_value=1, max_value=50, widget=forms.NumberInput(attrs={
        'class': 'form-input',
        'placeholder': '5',
        'id': 'profile-goal-input',
    }))


class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={
        'class': 'form-input',
        'placeholder': 'you@example.com',
    }))

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in self.fields:
            self.fields[field_name].widget.attrs.update({'class': 'form-input'})
        self.fields['username'].widget.attrs['placeholder'] = 'Choose a username'
        self.fields['password1'].widget.attrs['placeholder'] = 'Create a password'
        self.fields['password2'].widget.attrs['placeholder'] = 'Confirm password'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user
