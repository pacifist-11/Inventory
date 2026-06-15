import base64
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from models.schemas import SigninSchema, SignupSchema, ChangePasswordSchema, UpdateProfileSchema
from db import get_db_cursor

router = APIRouter(prefix="/authservice", tags=["Authentication Gateway"])

def generate_token(email: str, role: int) -> str:
    payload = f"{email}:{role}"
    return base64.b64encode(payload.encode("utf-8")).decode("utf-8")

def parse_token(token: str) -> tuple[str, int]:
    try:
        decoded = base64.b64decode(token.encode("utf-8")).decode("utf-8")
        parts = decoded.split(":")
        return parts[0], int(parts[1])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/signup")
async def signup(data: SignupSchema):
    try:
        with get_db_cursor() as cur:
            # Check if email exists
            cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
            if cur.fetchone():
                return JSONResponse(status_code=400, content={"code": 400, "message": "Email ID already registered"})
            
            # Insert user
            cur.execute(
                "INSERT INTO users (fullname, phone, email, password, role, status) VALUES (%s, %s, %s, %s, %s, 1)",
                (data.fullname, data.phone, data.email, data.password, data.role)
            )
            return JSONResponse(status_code=200, content={"code": 200, "message": "User account has been created"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"code": 500, "message": str(e)})

@router.post("/signin")
async def signin(data: SigninSchema):
    try:
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT fullname, email, role FROM users WHERE email = %s AND password = %s",
                (data.username, data.password)
            )
            row = cur.fetchone()
            if not row:
                return JSONResponse(status_code=400, content={"code": 400, "message": "Invalid Credentials!"})
            
            fullname, email, role = row
            token = generate_token(email, role)
            return JSONResponse(status_code=200, content={
                "code": 200,
                "message": "Validation Success",
                "jwt": token,
                "fullname": fullname,
                "email": email,
                "role": role
            })
    except Exception as e:
        return JSONResponse(status_code=500, content={"code": 500, "message": str(e)})

@router.get("/profile")
async def profile(Token: str = Header(...)):
    email, role = parse_token(Token)
    try:
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT fullname, email, phone, role, status FROM users WHERE email = %s",
                (email,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            fullname, email, phone, role, status = row
            return JSONResponse(status_code=200, content={
                "code": 200,
                "fullname": fullname,
                "email": email,
                "phone": phone,
                "role": role,
                "status": status
            })
    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(status_code=500, content={"code": 500, "message": str(e)})


@router.put("/profile")
async def update_profile(data: UpdateProfileSchema, Token: str = Header(...)):
    email, role = parse_token(Token)
    try:
        with get_db_cursor() as cur:
            cur.execute(
                "UPDATE users SET fullname = %s, phone = %s WHERE email = %s",
                (data.fullname, data.phone, email)
            )
            return JSONResponse(status_code=200, content={"code": 200, "message": "Profile updated successfully"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"code": 500, "message": str(e)})


@router.post("/change-password")
async def change_password(data: ChangePasswordSchema, Token: str = Header(...)):
    email, role = parse_token(Token)
    try:
        with get_db_cursor() as cur:
            # Check current password
            cur.execute("SELECT password FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            db_pass = row[0]
            if db_pass != data.currentPassword:
                return JSONResponse(status_code=400, content={"code": 400, "message": "Incorrect current password"})
            
            # Update password
            cur.execute("UPDATE users SET password = %s WHERE email = %s", (data.newPassword, email))
            return JSONResponse(status_code=200, content={"code": 200, "message": "Password changed successfully"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"code": 500, "message": str(e)})
