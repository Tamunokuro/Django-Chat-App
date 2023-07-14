from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import gettext_lazy as _
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class TokenAuthenticatication:
    model = None

    def get_model(self):
        if self.model is not None:
            return self.model
        return Token

    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = self.get_model().objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed(_("Invalid Token."))

        if not token.user.is_active:
            raise AuthenticationFailed(_("User is not active"))
        return token.user


@database_sync_to_async
def get_user(scope):
    if "token" not in scope:
        raise ValueError("Requires a 'token' to be present in the connection. Wrap consumer" "in TokenMiddleware")
    token = scope["token"]
    user = None
    try:
        auth = TokenAuthenticatication()
        user = auth.authenticate_credentials(token)
    except AuthenticationFailed:
        pass
    return user or AnonymousUser()


class TokenAuthMiddleware:
    """Token Middleware for Django Channels 2"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_params = parse_qs(scope["query_string"].decode())
        token = query_params["token"][0]
        scope["token"] = token
        scope["user"] = await get_user(scope)
        return await self.app(scope, receive, send)
