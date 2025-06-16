from decouple import config
from authx import AuthXConfig, AuthX


auth_config = AuthXConfig(
        JWT_ALGORITHM = "HS256",
        JWT_SECRET_KEY = config("RANDOM_SECRET"),
        JWT_TOKEN_LOCATION = ["cookies"],
        JWT_ACCESS_COOKIE_NAME="access_token",
        JWT_COOKIE_CSRF_PROTECT=False
)

auth = AuthX(config=auth_config)