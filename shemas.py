from pydantic import BaseModel, field_validator, EmailStr
import re
from typing import Optional

password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$'

class LoginForm(BaseModel):
    email: EmailStr
    password: str

    @classmethod
    @field_validator('password')
    def validate_password(cls, v):
        if not re.match(password_regex, v):
            raise ValueError(
                'Неверный формат пароля'
            )
        return v


class RegistrationForm(LoginForm):
    name: str
    surname: str

    @classmethod
    @field_validator('password')
    def validate_password(cls, v):
        if not re.match(password_regex, v):
            raise ValueError(
                'Неверный формат пароля'
            )
        return v


class Slide(BaseModel):
    title: str
    text: str
    image_path: Optional[str]
    order: int


class AlbumDTO(BaseModel):
    title: str
    description: str
    cover_image: str
    slides: list[Slide]