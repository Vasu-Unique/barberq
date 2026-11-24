#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Attempt alembic migration
if [ -f "alembic.ini" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Database migration warning: proceeding..."
fi

echo "Starting application..."
exec "$@"
