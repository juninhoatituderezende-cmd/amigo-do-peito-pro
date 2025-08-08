-- Disable email confirmation for regular user signups
ALTER DATABASE postgres SET app.settings.auth_confirm_email = 'false';