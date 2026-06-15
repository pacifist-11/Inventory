from datetime import datetime

from pydantic import BaseModel, Field


class InventoryItemSchema(BaseModel):
    name: str = Field(..., examples=["Vortex Mixer"])
    category: str = Field(..., examples=["Lab Equipment"])
    location: str = Field(..., examples=["Lab A"])
    stock: int = Field(..., ge=0, examples=[8])
    minStock: int = Field(..., ge=0, examples=[12])
    usageContext: str = Field(..., examples=["frequently used lab equipment"])
    unit: str = Field(default="units", examples=["units"])
    dailyUsage: int = Field(default=0, ge=0, examples=[5])


class InventoryItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    location: str | None = None
    stock: int | None = Field(default=None, ge=0)
    minStock: int | None = Field(default=None, ge=0)
    usageContext: str | None = None
    unit: str | None = None
    dailyUsage: int | None = Field(default=None, ge=0)


class InventoryAdjust(BaseModel):
    amount: int = Field(..., examples=[5])
    note: str | None = Field(default=None, examples=["Replenished from new shipment"])


class InventoryItemOut(InventoryItemSchema):
    id: int
    updatedAt: datetime
    status: str


class ActivityLogOut(BaseModel):
    id: int
    label: str
    createdAt: datetime


class SummaryOut(BaseModel):
    totalStock: int
    lowStockCount: int
    totalLocations: int
    totalUsage: int
    itemCount: int


class SigninSchema(BaseModel):
    username: str = Field(..., examples=["admin@inventory.com"])
    password: str = Field(..., examples=["admin123"])


class SignupSchema(BaseModel):
    fullname: str = Field(..., examples=["Inventory Admin"])
    phone: str = Field(..., examples=["9999999999"])
    email: str = Field(..., examples=["admin@inventory.com"])
    password: str = Field(..., examples=["admin123"])
    role: int = Field(default=2, examples=[2])


class ChangePasswordSchema(BaseModel):
    currentPassword: str = Field(..., examples=["admin123"])
    newPassword: str = Field(..., examples=["newadmin123"])


class UpdateProfileSchema(BaseModel):
    fullname: str = Field(..., examples=["Inventory Admin"])
    phone: str = Field(..., examples=["9999999999"])

