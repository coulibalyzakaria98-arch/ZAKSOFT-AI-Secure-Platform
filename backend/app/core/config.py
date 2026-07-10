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

    # CORS — accepts a JSON array string or defaults to allow all
    @property
    def CORS_ORIGINS(self) -> list:
        raw = os.getenv("CORS_ORIGINS", "")
        if not raw:
            return ["*"]
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            # Comma-separated fallback: "https://a.com,https://b.com"
            return [o.strip() for o in raw.split(",") if o.strip()]

    # Scanner timeouts
    HTTP_TIMEOUT: float = 15.0
    SSL_TIMEOUT: float = 10.0


settings = Settings()
