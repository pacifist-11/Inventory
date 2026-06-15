CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    location VARCHAR(80) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    usage_context TEXT NOT NULL,
    unit VARCHAR(40) NOT NULL DEFAULT 'units',
    daily_usage INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(120) NOT NULL,
    role INTEGER NOT NULL DEFAULT 1,
    status INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_inventory_items_name ON inventory_items (name);
CREATE INDEX IF NOT EXISTS ix_inventory_items_category ON inventory_items (category);
CREATE INDEX IF NOT EXISTS ix_inventory_items_location ON inventory_items (location);
