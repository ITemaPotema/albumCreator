from fastapi import APIRouter, Depends, Form, UploadFile, File, Response
from fastapi.responses import JSONResponse
from database import *
from app_config import auth, auth_config
from authx import TokenPayload
from shemas import LoginForm, RegistrationForm, AlbumDTO
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid
import json
import os
import secrets
import shutil

api_router = APIRouter(prefix="/api")


@api_router.post("/login")
def login_user(login_data: LoginForm, db: Session = Depends(get_db)):
    email = login_data.email
    password = login_data.password

    user = db.query(UsersModel).filter_by(email=email, password=password).first()

    if not user:
        return JSONResponse(content={"error": "user not found"}, status_code=404)

    access_token = auth.create_access_token(uid=str(user.id), data={"fname": user.name, "lname": user.surname})

    response = JSONResponse(content={"access_token": access_token})
    response.set_cookie(
        key=auth_config.JWT_ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        max_age=900,
        samesite="lax",
        path="/",
    )

    return response


@api_router.post("/logout")
def user_logout(response: Response):
    response.delete_cookie(key=auth_config.JWT_ACCESS_COOKIE_NAME)

    return JSONResponse(content={"status": "successfully logged out"})


@api_router.post("/register")
def register_user(user_data: RegistrationForm, db: Session = Depends(get_db)):
    user_exist = db.query(UsersModel).filter_by(email=user_data.email).first()

    if user_exist:
        return JSONResponse(content={"error": "user with this email already exists"}, status_code=409)

    user_data = user_data.model_dump()

    new_user = UsersModel(**user_data)
    db.add(new_user)
    db.commit()

    user_id = new_user.id
    access_token = auth.create_access_token(uid=str(user_id), data={"fname": new_user.name, "lname": new_user.surname})

    response = JSONResponse(content={"access_token": access_token})
    response.set_cookie(
        key=auth_config.JWT_ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        max_age=900,
        samesite="lax",
        path="/",
    )

    return response


@api_router.post("/albums/create")
async def create_album(
    title: str = Form(...),
    description: str = Form(...),
    slides: str = Form(...),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    payload: TokenPayload = Depends(auth.access_token_required)
):

    user_id = int(payload.sub)
    album_id = str(uuid.uuid4()) # генерируем id альбома

    album_image_folder_path = f"static/{album_id}"
    os.mkdir(album_image_folder_path) # создаём папку для хранения изображений конкретного альбома

    album = AlbumModel(id=album_id, title=title, description=description, creator_id=user_id)

    slides_data = json.loads(slides)
    slides_union_images = list(zip(slides_data, images))

    for i in range(len(slides_union_images)):
        slide_data, image_data = slides_union_images[i]

        slide = SlidesModel(**slide_data)

        file_name = secrets.token_urlsafe(10) + image_data.filename # добавляем в начало случайную строку, чтобы избежать конфликта имён
        image_path = f"{album_image_folder_path}/{file_name}"

        if i == 0:
            album.cover_image = image_path # ставим первое фото на обложку альбома

        # сохраняем файл в static
        with open(image_path, "wb") as buffer:
            content = await image_data.read()
            buffer.write(content)

        slide.album_id = album_id
        slide.image_path = "/" + image_path

        db.add(slide)

    db.add(album)
    db.commit()

    return JSONResponse(content={"status": "ok"})


@api_router.get("/albums/data/{album_id}")
def get_album_data(
        album_id: str,
        db: Session = Depends(get_db)
        ):

    album = db.query(AlbumModel).options(joinedload(AlbumModel.slides)).filter_by(id=album_id).first()
    album_dto = AlbumDTO.model_validate(album, from_attributes=True)
    response_data = album_dto.model_dump()

    response_data["slides"] = sorted(response_data["slides"], key=lambda slide: slide["order"])

    return JSONResponse(content={"album": response_data})


@api_router.put("/albums/{album_id}/save-changes")
async def save_album_edit_changes(
    album_id: str,
    title: str = Form(...),
    description: str = Form(...),
    slides: str = Form(...),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    payload: TokenPayload = Depends(auth.access_token_required)
):

    user_id = int(payload.sub)

    album = db.query(AlbumModel).filter_by(id=album_id).first()

    if not album:
        return JSONResponse(content={"error": "album not found"}, status_code=404)

    # проверка, что альбом принадлежит данному пользователю
    if album.creator_id != user_id:
        return JSONResponse(content={"error": "album with this id is not yours"}, status_code=403)

    album_image_folder_path = f"static/{album_id}"

    album.slides.clear() # удаляем слайды

    slides = json.loads(slides)
    img_index = 0

    for i, slide  in enumerate(slides):
        if not slide.get("image_path"): # обрабатываем те слайды, которые пользователь загрузил впервые
            image = images[img_index]
            file_name = secrets.token_urlsafe(10) + image.filename
            image_path = f"{album_image_folder_path}/{file_name}"
            slide["image_path"] = "/" + image_path

            # сохраняем файл в static
            with open(image_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)

            img_index += 1

        if i == 0:
            album.cover_image = slide["image_path"]  # ставим фото первого слайда на обложку альбома

        slide = SlidesModel(**slide)  # создаём новый слайд

        slide.album_id = album.id
        album.slides.append(slide)  # добавляем новые слайды в альбом


    album.title = title
    album.description = description

    db.commit()

    return JSONResponse(content={"status": "ok"})


@api_router.delete("/album/{album_id}/delete")
def delete_album(
        album_id: str,
        db: Session = Depends(get_db),
        payload: TokenPayload = Depends(auth.access_token_required)
):
    user_id = int(payload.sub)

    album = db.query(AlbumModel).options(joinedload(AlbumModel.slides)).filter_by(id=album_id).first()

    if not album:
        return JSONResponse(content={"error": "album not found"}, status_code=404)

    if album.creator_id != user_id:
        return JSONResponse(content={"error": "the album you want to delete is not yours"}, status_code=403)


    album_image_folder_path = f"static/{album_id}"

    try:
        if os.path.exists(album_image_folder_path):
            shutil.rmtree(album_image_folder_path) # удаляем папку с изображениями данного альбома

    except Exception:
       print("Не удалось удалить папку с изображениями данного альбома!")

    db.delete(album)
    db.commit()

    return JSONResponse(content={"status": "deleted successfully"})