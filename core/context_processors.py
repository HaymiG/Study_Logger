def user_initials(request):
    """Make user_initials available in all templates."""
    if request.user.is_authenticated:
        name = request.user.get_full_name() or request.user.username
        initials = ''.join(w[0] for w in name.split() if w).upper()[:2]
        return {'user_initials': initials}
    return {'user_initials': ''}
