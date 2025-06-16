from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import create_engine, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import event
from sqlalchemy.engine import Engine
from decouple import config


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

engine = create_engine(config("DB_URL"), connect_args={"check_same_thread": False})
class Base(DeclarativeBase): pass

SessionLocal = sessionmaker(bind=engine)

def get_db():
    with SessionLocal() as session:
        yield session


class UsersModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str]
    surname: Mapped[str]
    email: Mapped[str]
    password: Mapped[str]

    albums: Mapped[list["AlbumModel"]] = relationship(back_populates="user", cascade="all, delete")


class AlbumModel(Base):
    __tablename__ = "albums"

    id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str]
    cover_image: Mapped[str]
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    slides: Mapped[list["SlidesModel"]] = relationship(back_populates="album", cascade="all, delete")
    user: Mapped["UsersModel"] = relationship(back_populates="albums")


class SlidesModel(Base):
    __tablename__ = "slides"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str]
    text: Mapped[str]
    image_path: Mapped[str] = mapped_column(nullable=True)
    order: Mapped[int]
    album_id: Mapped[str] = mapped_column(ForeignKey("albums.id", ondelete="CASCADE"), nullable=True)

    album: Mapped[AlbumModel] = relationship(back_populates="slides")

