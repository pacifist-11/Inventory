INSERT INTO inventory_items
    (name, category, location, stock, min_stock, usage_context, unit, daily_usage)
VALUES
    ('Vortex Mixer', 'Lab Equipment', 'Lab A', 8, 12, 'frequently used lab equipment', 'units', 5),
    ('Laptop Chargers', 'Electronics', 'Store Room', 24, 18, 'low stock electronic accessories', 'sets', 3),
    ('Sterile Gloves', 'Consumables', 'Lab B', 16, 20, 'low stock medical supplies sterile supplies', 'boxes', 7),
    ('Barcode Scanners', 'Electronics', 'Front Desk', 11, 10, 'front desk equipment', 'units', 2)
ON CONFLICT DO NOTHING;

INSERT INTO activity_logs (label)
VALUES
    ('Replenished sterile gloves in Lab B'),
    ('Consumed 2 laptop chargers for field ops'),
    ('Vortex mixer status updated to low stock'),
    ('Barcode scanners reviewed for weekly audit');

INSERT INTO users (fullname, phone, email, password, role, status)
VALUES ('Inventory Admin', '9999999999', 'admin@inventory.com', 'admin123', 1, 1)
ON CONFLICT (email) DO NOTHING;
