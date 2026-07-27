# Kambata Travel – Production Database Backup Plan

## Overview
This document outlines the backup, retention, and disaster recovery strategy for the Kambata Travel MongoDB production database.

## 1. Backup Strategy

**A. Automated Daily Backups**
- **Type**: Full Database Snapshot
- **Frequency**: Every 24 hours at 02:00 AM (EAT)
- **Tool**: MongoDB Atlas Automated Backups / Custom Cron Job (if self-hosted)
- **Retention**: 30 days

**B. Continuous Backup (Point-in-Time Recovery - PITR)**
- **Type**: Oplog Backup
- **Frequency**: Continuous
- **Retention**: 7 days
- **Use Case**: Allows restoring the database to any specific minute within the last 7 days.

**C. Weekly Off-Site Backups**
- **Type**: Compressed BSON Dump
- **Frequency**: Every Sunday at 03:00 AM (EAT)
- **Storage Location**: AWS S3 Bucket (Region: eu-central-1)
- **Retention**: 1 year (Moved to S3 Glacier after 90 days)

## 2. Infrastructure Configuration

If using MongoDB Atlas (Recommended for Production):
1. Navigate to your cluster.
2. Select **Backup** tab.
3. Ensure **Cloud Provider Snapshots** are enabled.
4. Enable **Continuous Cloud Backups (PITR)**.
5. Set retention policy matching the strategy above.

If self-hosted:
Use `mongodump` via a cron job on the server:
```bash
0 2 * * * mongodump --uri="mongodb://admin:password@localhost:27017/kambata_db" --archive=/backups/kambata_$(date +\%F).gz --gzip
```

## 3. Restoration Procedure

### In case of data loss or corruption:

**For MongoDB Atlas:**
1. Log in to MongoDB Atlas.
2. Go to the **Clusters** view and click **Backup**.
3. Select **Restore** for the target cluster.
4. Choose **Point in Time** or **Snapshot**.
5. Select the destination (either the same cluster or a new isolated cluster for verification).
6. Click **Restore**.

**For Self-Hosted (mongorestore):**
```bash
mongorestore --uri="mongodb://admin:password@localhost:27017/kambata_db" --archive=/backups/kambata_YYYY-MM-DD.gz --gzip
```

## 4. Disaster Recovery (DR) Drills
- A test restoration should be performed **quarterly** in an isolated staging environment.
- Verify that users, bookings, tours, and payments restore correctly without integrity issues.
- Document the time taken to restore (RTO - Recovery Time Objective) to ensure it meets business SLAs.

## 5. Security & Access
- All backups must be encrypted at rest (AES-256).
- Access to the S3 bucket or Atlas backup dashboard must be restricted to Lead DevOps / Admins via strict IAM policies and MFA.
