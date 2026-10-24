from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "readmissioniq"
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    diabetes_data_path: str = "data/diabetes_130.csv"
    heart_data_path: str = "data/heart_failure.csv"
    models_dir: str = "models"

    model_config = {"env_file": ".env"}


settings = Settings()
