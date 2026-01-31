CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed with current departments
INSERT IGNORE INTO departments (name, code) VALUES 
('Computer Science', 'CSE'),
('Electronics', 'ECE'),
('Electrical', 'EEE'),
('Mechanical', 'MECH'),
('Civil', 'CIVIL'),
('Information Technology', 'IT'),
('Artificial Intelligence', 'AIML'),
('Internet of Things', 'IoT'),
('CS Business Systems', 'CSBS');
