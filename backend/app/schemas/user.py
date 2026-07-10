from pydantic import BaseModel, field_validator
import re


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email invalide")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Mot de passe trop court (min. 6 caractères)")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
