#!/bin/sh
set -e

echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

echo "Running database migrations..."
pnpm prisma db push --accept-data-loss

echo "Starting application..."
exec "$@"
