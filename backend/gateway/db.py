import psycopg2
from contextlib import contextmanager

DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "inventory_monitoring_db"
DB_USER = "postgres"
DB_PASS = "Irctc@11"

@contextmanager
def get_db_cursor():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    conn.autocommit = True
    cur = conn.cursor()
    try:
        yield cur
    finally:
        cur.close()
        conn.close()
