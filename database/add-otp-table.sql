-- Migration: Add OTP verification table
-- Run this against your local kashmirmove database

USE kashmirmove;

CREATE TABLE IF NOT EXISTS verification_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
