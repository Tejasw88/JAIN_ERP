-- =====================================================
-- JAIN LMS Database Migration: Phase 3-10 Features
-- Run this script on your MySQL database to add
-- all required tables for the new features
-- =====================================================

-- Phase 3: Timetable Generation
-- =====================================================

-- Timetable slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    slot_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id INT,
    teacher_id INT,
    room VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_slot (department, year, section, day_of_week, slot_number)
);

-- Class teacher assignments
CREATE TABLE IF NOT EXISTS class_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class (department, year, section)
);

-- Phase 8: Leave Request System
-- =====================================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_name VARCHAR(100),
    department VARCHAR(100),
    year INT,
    leave_type ENUM('sick', 'personal', 'emergency', 'academic') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'forwarded_to_hod', 'hod_approved', 'hod_rejected') DEFAULT 'pending',
    class_teacher_id INT,
    teacher_remarks TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP NULL,
    forwarded_to_hod_at TIMESTAMP NULL,
    hod_approved_by VARCHAR(100),
    hod_remarks TEXT,
    hod_approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Phase 9: HOD Role Features
-- =====================================================

-- Add HOD fields to users table (run as ALTER if users table exists)
-- Note: These may already exist, so we use IF NOT EXISTS logic safely

-- Check and add is_hod column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_hod') = 0,
    "ALTER TABLE users ADD COLUMN is_hod BOOLEAN DEFAULT FALSE",
    "SELECT 'Column is_hod already exists'"
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add hod_department column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'hod_department') = 0,
    "ALTER TABLE users ADD COLUMN hod_department VARCHAR(100) DEFAULT NULL",
    "SELECT 'Column hod_department already exists'"
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error', 'summon') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Phase 10: Exam Hall Locator
-- =====================================================

-- Exam halls table
CREATE TABLE IF NOT EXISTS exam_halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INT DEFAULT 0,
    capacity INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam schedules table
CREATE TABLE IF NOT EXISTS exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    course_id INT,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_visible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Exam seating arrangement
CREATE TABLE IF NOT EXISTS exam_seating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    hall_id INT NOT NULL,
    seat_number INT NOT NULL,
    row_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id) REFERENCES exam_halls(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat (exam_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX idx_timetable_dept_year ON timetable_slots(department, year);
CREATE INDEX idx_timetable_day ON timetable_slots(day_of_week);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_student ON leave_requests(student_id);
CREATE INDEX idx_leave_teacher ON leave_requests(class_teacher_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_exam_seating_exam ON exam_seating(exam_id);
CREATE INDEX idx_exam_seating_student ON exam_seating(student_id);

-- =====================================================
-- Sample Data (Optional - Uncomment to add test data)
-- =====================================================

-- Sample exam halls
-- INSERT INTO exam_halls (name, building, floor, capacity) VALUES
-- ('Hall A', 'Main Block', 1, 60),
-- ('Hall B', 'Main Block', 1, 50),
-- ('Hall C', 'Main Block', 2, 40),
-- ('Lab 1', 'Science Block', 0, 30),
-- ('Lab 2', 'Science Block', 0, 30);

-- =====================================================
-- Migration Complete!
-- =====================================================

SELECT 'Migration completed successfully!' as Status;
