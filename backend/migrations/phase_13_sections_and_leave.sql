-- Migration: Add Section to Users and Leave Requests
-- This enables correct leave request routing per section

-- Add section to users table
ALTER TABLE users ADD COLUMN section VARCHAR(10) DEFAULT 'A';

-- Add section to leave_requests table
ALTER TABLE leave_requests ADD COLUMN section VARCHAR(10) DEFAULT 'A';

-- Add section to class_teachers table
ALTER TABLE class_teachers ADD COLUMN section VARCHAR(10) DEFAULT 'A';
