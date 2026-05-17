

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'SUSPEND_USER', 'ACTIVATE_USER', 'APPROVE_DRIVER'
    target_id INT,                    -- ID of the affected user/driver
    target_type ENUM('customer', 'driver'),
    details TEXT,                     -- JSON or descriptive string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
