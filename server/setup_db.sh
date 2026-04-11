#!/bin/bash
echo "Run migrations with psql"
psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -d ${DB_NAME:-vet_network} -f migrations/001_create_tables.sql
