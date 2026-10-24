from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, ASCENDING, DESCENDING
from ..config import settings


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    # Create indexes for fast lookups
    database = db.client[settings.database_name]
    await database["predictions"].create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    await database["predictions"].create_index([("patient_name", ASCENDING)])
    await database["predictions"].create_index([("patient_record_id", ASCENDING)])
    await database["predictions"].create_index([("prediction_id", ASCENDING)])
    await database["patients"].create_index([("patient_record_id", ASCENDING)], unique=True)
    await database["patients"].create_index([("user_id", ASCENDING), ("full_name", ASCENDING)])
    print(f"Connected to MongoDB at {settings.mongodb_url}")


async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")


def get_database():
    return db.client[settings.database_name]
