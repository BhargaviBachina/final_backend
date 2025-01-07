-- Create the database
CREATE DATABASE IF NOT EXISTS user_auth;

-- Use the created database
USE user_auth;

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,   -- Unique ID for each user
    username VARCHAR(255) NOT NULL,      -- Username of the user
    email VARCHAR(255) NOT NULL UNIQUE,  -- Email (unique)
    password VARCHAR(255) NOT NULL,      -- Hashed password
    phoneNumber VARCHAR(15),             -- User's phone number (optional)
    gender ENUM('Male', 'Female', 'Other'), -- Gender of the user (optional)
    dob DATE,                            -- Date of birth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation time
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Record update time
);