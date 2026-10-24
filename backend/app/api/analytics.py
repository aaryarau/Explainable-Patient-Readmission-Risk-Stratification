from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone

from ..auth.utils import get_current_user
from ..database.connection import get_database

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary(current_user=Depends(get_current_user)):
    db = get_database()
    predictions_col = db["predictions"]

    total = await predictions_col.count_documents({})
    high_risk = await predictions_col.count_documents({"risk_level": "high"})
    medium_risk = await predictions_col.count_documents({"risk_level": "medium"})
    low_risk = await predictions_col.count_documents({"risk_level": "low"})

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = await predictions_col.count_documents({"created_at": {"$gte": week_ago}})

    return {
        "total_predictions": total,
        "risk_distribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
        },
        "predictions_last_7_days": recent,
    }


@router.get("/trends")
async def prediction_trends(
    days: int = Query(30, ge=1, le=365),
    dataset: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    db = get_database()
    since = datetime.now(timezone.utc) - timedelta(days=days)
    query: dict = {"created_at": {"$gte": since}}
    if dataset:
        query["dataset"] = dataset

    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                    "day": {"$dayOfMonth": "$created_at"},
                },
                "count": {"$sum": 1},
                "avg_probability": {"$avg": "$probability"},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}},
    ]

    cursor = db["predictions"].aggregate(pipeline)
    results = await cursor.to_list(length=1000)

    trends = [
        {
            "date": f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}",
            "count": r["count"],
            "avg_probability": round(r["avg_probability"], 4),
        }
        for r in results
    ]
    return {"trends": trends, "days": days}


@router.get("/dataset-distribution")
async def dataset_distribution(current_user=Depends(get_current_user)):
    db = get_database()
    pipeline = [
        {"$group": {"_id": "$dataset", "count": {"$sum": 1}}},
    ]
    cursor = db["predictions"].aggregate(pipeline)
    results = await cursor.to_list(length=10)
    return {"distribution": [{"dataset": r["_id"], "count": r["count"]} for r in results]}
