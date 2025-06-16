from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import uvicorn
from database import *
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app_config import auth, auth_config
from authx import TokenPayload
from authx.exceptions import InvalidToken, MissingTokenError
from sqlalchemy.orm import Session
from api import api_router



app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(api_router)

Base.metadata.create_all(bind=engine)


# обработчик исключений, связанных с JWT
@app.exception_handler(InvalidToken)
@app.exception_handler(MissingTokenError)
async def auth_exception_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api"):
        response = JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
        )
    else:
        response = RedirectResponse(url="/auth", status_code=303)

    response.delete_cookie(auth_config.JWT_ACCESS_COOKIE_NAME)
    return response


@app.get("/")
def main_view(request: Request, payload: TokenPayload = Depends(auth.access_token_required)):
    first_name, last_name = getattr(payload, "fname"), getattr(payload, "lname")

    content = {
        "request": request,
        "first_name": first_name,
        "last_name": last_name
    }

    return templates.TemplateResponse("index.html", context=content)


@app.get("/auth")
def login_page_view(request: Request):
    return templates.TemplateResponse("auth.html", context={"request": request})


@app.get("/my-albums")
def index_view(request: Request,
               db: Session = Depends(get_db),
               payload: TokenPayload = Depends(auth.access_token_required)
               ):

    user_id = int(payload.sub)
    albums = db.query(AlbumModel).filter_by(creator_id=user_id).all()


    return templates.TemplateResponse("my_albums.html", context={"request": request, "albums": albums})


@app.get("/create", dependencies=[Depends(auth.access_token_required)])
def create_view(request: Request):
    return templates.TemplateResponse("create_album.html", context={"request": request})


@app.get("/album/{album_id}/edit", dependencies=[Depends(auth.access_token_required)])
def edit_album_view(request: Request):
    return templates.TemplateResponse("edit_album.html", context={"request": request})


@app.get("/album/watch/{album_id}")
def show_album_view(
    request: Request,
    album_id: str,
):

    return templates.TemplateResponse("show-album.html", context={"request": request})



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0",
                port=8000,
                )