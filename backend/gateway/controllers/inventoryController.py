import os
import datetime
from fastapi import APIRouter, HTTPException, Query, Header, Response
from fastapi.responses import JSONResponse
from models.schemas import (
    ActivityLogOut,
    InventoryAdjust,
    InventoryItemSchema,
    InventoryItemOut,
    InventoryItemUpdate,
    SummaryOut,
)
from db import get_db_cursor
from controllers.authenticationController import parse_token

router = APIRouter(prefix="/inventoryservice", tags=["Inventory Gateway"])

@router.get("/items")
async def get_items(
    search: str | None = Query(default=None),
    location: str | None = Query(default=None),
    semantic_query: str | None = Query(default=None),
):
    try:
        with get_db_cursor() as cur:
            query = "SELECT id, name, category, location, stock, min_stock, usage_context, unit, daily_usage, updated_at FROM inventory_items"
            conditions = []
            params = []
            
            if location and location != "All" and location != "":
                conditions.append("location = %s")
                params.append(location)
                
            cur.execute(query)
            rows = cur.fetchall()
            
            items = []
            for row in rows:
                item_id, name, category, loc, stock, min_stock, usage_context, unit, daily_usage, updated_at = row
                text = f"{name} {category} {loc} {usage_context}".lower()
                
                if search and search.strip():
                    if search.lower() not in text:
                        continue
                
                if semantic_query and semantic_query.strip():
                    matched = False
                    for word in semantic_query.lower().split():
                        if word in text:
                            matched = True
                            break
                    if not matched:
                        continue
                        
                if len(conditions) > 0:
                    if loc != location:
                        continue
                
                items.append({
                    "id": item_id,
                    "name": name,
                    "category": category,
                    "location": loc,
                    "stock": stock,
                    "minStock": min_stock,
                    "usageContext": usage_context,
                    "unit": unit,
                    "dailyUsage": daily_usage,
                    "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                    "status": "low" if stock <= min_stock else "ok"
                })
            
            items.sort(key=lambda x: x["id"])
            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items/{item_id}")
async def get_item(item_id: int):
    try:
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT id, name, category, location, stock, min_stock, usage_context, unit, daily_usage, updated_at FROM inventory_items WHERE id = %s",
                (item_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Inventory item not found")
            
            item_id, name, category, loc, stock, min_stock, usage_context, unit, daily_usage, updated_at = row
            return {
                "id": item_id,
                "name": name,
                "category": category,
                "location": loc,
                "stock": stock,
                "minStock": min_stock,
                "usageContext": usage_context,
                "unit": unit,
                "dailyUsage": daily_usage,
                "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                "status": "low" if stock <= min_stock else "ok"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/items")
async def create_item(data: InventoryItemSchema, Token: str | None = Header(default=None)):
    if Token:
        _, role = parse_token(Token)
        if role != 1:
            raise HTTPException(status_code=403, detail="Forbidden: Admin role required")
    
    try:
        with get_db_cursor() as cur:
            cur.execute(
                """INSERT INTO inventory_items (name, category, location, stock, min_stock, usage_context, unit, daily_usage, updated_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP) RETURNING id, updated_at""",
                (data.name, data.category, data.location, data.stock, data.minStock, data.usageContext, data.unit, data.dailyUsage)
            )
            row = cur.fetchone()
            item_id, updated_at = row
            
            cur.execute(
                "INSERT INTO activity_logs (label, created_at) VALUES (%s, CURRENT_TIMESTAMP)",
                (f"Added {data.name} to {data.location}",)
            )
            
            return {
                "id": item_id,
                "name": data.name,
                "category": data.category,
                "location": data.location,
                "stock": data.stock,
                "minStock": data.minStock,
                "usageContext": data.usageContext,
                "unit": data.unit,
                "dailyUsage": data.dailyUsage,
                "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                "status": "low" if data.stock <= data.minStock else "ok"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/items/{item_id}")
async def update_item(item_id: int, data: InventoryItemUpdate, Token: str | None = Header(default=None)):
    if Token:
        _, role = parse_token(Token)
        if role != 1:
            raise HTTPException(status_code=403, detail="Forbidden: Admin role required")
            
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT name, category, location, stock, min_stock, usage_context, unit, daily_usage FROM inventory_items WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Inventory item not found")
            
            curr_name, curr_category, curr_location, curr_stock, curr_min_stock, curr_usage_context, curr_unit, curr_daily_usage = row
            
            name = data.name if data.name is not None else curr_name
            category = data.category if data.category is not None else curr_category
            location = data.location if data.location is not None else curr_location
            stock = data.stock if data.stock is not None else curr_stock
            min_stock = data.minStock if data.minStock is not None else curr_min_stock
            usage_context = data.usageContext if data.usageContext is not None else curr_usage_context
            unit = data.unit if data.unit is not None else curr_unit
            daily_usage = data.dailyUsage if data.dailyUsage is not None else curr_daily_usage
            
            cur.execute(
                """UPDATE inventory_items SET name=%s, category=%s, location=%s, stock=%s, min_stock=%s, usage_context=%s, unit=%s, daily_usage=%s, updated_at=CURRENT_TIMESTAMP 
                   WHERE id=%s RETURNING updated_at""",
                (name, category, location, stock, min_stock, usage_context, unit, daily_usage, item_id)
            )
            updated_at = cur.fetchone()[0]
            
            cur.execute(
                "INSERT INTO activity_logs (label, created_at) VALUES (%s, CURRENT_TIMESTAMP)",
                (f"Updated {name} inventory details",)
            )
            
            return {
                "id": item_id,
                "name": name,
                "category": category,
                "location": location,
                "stock": stock,
                "minStock": min_stock,
                "usageContext": usage_context,
                "unit": unit,
                "dailyUsage": daily_usage,
                "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                "status": "low" if stock <= min_stock else "ok"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/items/{item_id}/adjust")
async def adjust_item(item_id: int, data: InventoryAdjust, Token: str | None = Header(default=None)):
    if Token:
        _, role = parse_token(Token)
        if role != 1:
            raise HTTPException(status_code=403, detail="Forbidden: Admin role required")
            
    try:
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT name, stock, min_stock, unit, category, location, usage_context, daily_usage FROM inventory_items WHERE id = %s",
                (item_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Inventory item not found")
            
            name, stock, min_stock, unit, category, location, usage_context, daily_usage = row
            new_stock = max(0, stock + data.amount)
            
            cur.execute(
                "UPDATE inventory_items SET stock = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING updated_at",
                (new_stock, item_id)
            )
            updated_at = cur.fetchone()[0]
            
            action = "Replenished" if data.amount > 0 else "Consumed"
            note = f" ({data.note})" if data.note and data.note.strip() else ""
            label = f"{action} {abs(data.amount)} {unit} of {name}{note}"
            cur.execute(
                "INSERT INTO activity_logs (label, created_at) VALUES (%s, CURRENT_TIMESTAMP)",
                (label,)
            )
            
            return {
                "id": item_id,
                "name": name,
                "category": category,
                "location": location,
                "stock": new_stock,
                "minStock": min_stock,
                "usageContext": usage_context,
                "unit": unit,
                "dailyUsage": daily_usage,
                "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                "status": "low" if new_stock <= min_stock else "ok"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: int, Token: str | None = Header(default=None)):
    if Token:
        _, role = parse_token(Token)
        if role != 1:
            raise HTTPException(status_code=403, detail="Forbidden: Admin role required")
            
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT name FROM inventory_items WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Inventory item not found")
            name = row[0]
            
            cur.execute("DELETE FROM inventory_items WHERE id = %s", (item_id,))
            
            cur.execute(
                "INSERT INTO activity_logs (label, created_at) VALUES (%s, CURRENT_TIMESTAMP)",
                (f"Removed {name} from inventory monitoring",)
            )
            return Response(status_code=204)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/locations")
async def get_locations():
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT DISTINCT location FROM inventory_items")
            rows = cur.fetchall()
            return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity")
async def get_activity():
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT id, label, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 20")
            rows = cur.fetchall()
            activity_list = []
            for row in rows:
                log_id, label, created_at = row
                activity_list.append({
                    "id": log_id,
                    "label": label,
                    "createdAt": created_at.isoformat() if isinstance(created_at, datetime.datetime) else str(created_at)
                })
            return activity_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queue")
async def get_replenishment_queue():
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT id, name, category, location, stock, min_stock, usage_context, unit, daily_usage, updated_at FROM inventory_items WHERE stock <= min_stock ORDER BY id ASC")
            rows = cur.fetchall()
            queue_list = []
            for row in rows:
                item_id, name, category, loc, stock, min_stock, usage_context, unit, daily_usage, updated_at = row
                queue_list.append({
                    "id": item_id,
                    "name": name,
                    "category": category,
                    "location": loc,
                    "stock": stock,
                    "minStock": min_stock,
                    "usageContext": usage_context,
                    "unit": unit,
                    "dailyUsage": daily_usage,
                    "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else str(updated_at),
                    "status": "low"
                })
            return queue_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_summary():
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT stock, min_stock, location, daily_usage FROM inventory_items")
            rows = cur.fetchall()
            
            total_stock = sum(row[0] for row in rows)
            low_stock_count = sum(1 for row in rows if row[0] <= row[1])
            total_locations = len(set(row[2] for row in rows))
            total_usage = sum(row[3] for row in rows)
            item_count = len(rows)
            
            return {
                "totalStock": total_stock,
                "lowStockCount": low_stock_count,
                "totalLocations": total_locations,
                "totalUsage": total_usage,
                "itemCount": item_count
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/semantic-queries")
async def get_semantic_queries():
    return [
        "Low stock electronic items",
        "Frequently used lab equipment",
        "Replenish sterile supplies"
    ]
