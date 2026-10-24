from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone

from .models import UserCreate, UserLogin, UserResponse, Token, PasswordChange, UserUpdate
from .utils import hash_password, verify_password, create_access_token, get_current_user
from ..database.connection import get_database
from ..database.models import UserDocument

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    users_col = db["users"]

    # Check for duplicate email / username
    if await users_col.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await users_col.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_doc = UserDocument(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
    )
    result = await users_col.insert_one(user_doc.model_dump(by_alias=True, exclude_none=True))
    created = await users_col.find_one({"_id": result.inserted_id})

    return UserResponse(
        id=str(created["_id"]),
        email=created["email"],
        username=created["username"],
        full_name=created.get("full_name"),
        role=created["role"],
        is_active=created["is_active"],
        created_at=created["created_at"],
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    users_col = db["users"]

    user = await users_col.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")

    await users_col.update_one(
        {"_id": user["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    return Token(
        access_token=token,
        expires_in=30 * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    db = get_database()
    from bson import ObjectId

    user = await db["users"].find_one({"_id": ObjectId(current_user.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        full_name=user.get("full_name"),
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
    )


@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user=Depends(get_current_user)):
    db = get_database()
    from bson import ObjectId

    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    if updates:
        await db["users"].update_one(
            {"_id": ObjectId(current_user.user_id)}, {"$set": updates}
        )

    user = await db["users"].find_one({"_id": ObjectId(current_user.user_id)})
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        full_name=user.get("full_name"),
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange, current_user=Depends(get_current_user)
):
    db = get_database()
    from bson import ObjectId

    user = await db["users"].find_one({"_id": ObjectId(current_user.user_id)})
    if not verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(password_data.new_password)
    await db["users"].update_one(
        {"_id": ObjectId(current_user.user_id)},
        {"$set": {"hashed_password": new_hash}},
    )
    return {"message": "Password updated successfully"}
