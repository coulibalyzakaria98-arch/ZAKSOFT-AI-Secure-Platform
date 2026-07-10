import os
import json
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "ZAKSOFT AI Secure Platform"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered cybersecurity platform for African SMEs"

    # Database — SQLite by default, swap DATABASE_URL to postgres:// for prod
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zaksoft.db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "zaksoft-dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # AI providers — configure at least one in .env
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # CORS — accepts JSON array, comma-separated string, or "*"
    @property
    def CORS_ORIGINS(self) -> list:
        raw = os.getenv("CORS_ORIGINS", "*")
        if raw == "*":
            return ["*"]
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return [o.strip() for o in raw.split(",") if o.strip()]

    # Allow wildcard subdomains (Vercel preview URLs, etc.)
    @property
    def CORS_ORIGIN_REGEX(self) -> str | None:
        return os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

    # Scanner timeouts
    HTTP_TIMEOUT: float = 15.0
    SSL_TIMEOUT: float = 10.0


settings = Settings()
