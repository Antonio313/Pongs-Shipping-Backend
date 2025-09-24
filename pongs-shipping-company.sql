-- Users Table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Increased length for modern hashing algorithms
    phone VARCHAR(20),
    address TEXT,
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('Priory', 'Ocho Rios')),
    role CHAR(1) NOT NULL DEFAULT 'C' CHECK (role IN ('A', 'C', 'S')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Users
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_token_expires TIMESTAMP,
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;

ALTER TABLE users
ADD COLUMN reset_password_token varchar(255)
ADD COLUMN reset_password_expires TIMESTAMP

ALTER TABLE Users 
DROP CONSTRAINT users_role_check;

CREATE TABLE Packages (
    package_id VARCHAR(10) PRIMARY KEY, -- Increased to 10 chars for more unique IDs
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    tracking_number VARCHAR(20) UNIQUE NOT NULL, -- Added tracking number
    weight NUMERIC(5,2) NOT NULL CHECK (weight > 0), -- Increased precision
    length NUMERIC(5,2),
    width NUMERIC(5,2),
    height NUMERIC(5,2),
    description TEXT,
    cost NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'in transit', 'out for delivery', 'delivered', 'hold')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- First, drop the existing check constraint
ALTER TABLE Packages DROP CONSTRAINT packages_status_check;

-- Alter the status column to increase VARCHAR capacity and set new values
ALTER TABLE Packages 
ALTER COLUMN status TYPE VARCHAR(50),
ALTER COLUMN status SET DEFAULT 'Processing';

-- Add the new check constraint with updated values
ALTER TABLE Packages
ADD CONSTRAINT packages_status_check
CHECK (status IN (
    'Processing',
    'Delivered to Overseas Warehouse',
    'In Transit to Jamaica',
    'Arrived in Jamaica',
    'Arrived at Selected Branch',
    'In Transit to Selected Branch',
    'Ready For Pickup',
    'Out for Delivery',
    'Delivered'
));

ALTER TABLE Packages
ADD COLUMN finalCost NUMERIC(5,2)

ALTER TABLE Packages 
ALTER COLUMN finalCost TYPE NUMERIC(10,2);

-- Pre-Alerts Table
CREATE TABLE PreAlerts (
    prealert_id SERIAL PRIMARY KEY, -- Use serial for simpler relationships
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    package_id VARCHAR(10),
    description TEXT,
    price NUMERIC(10,2) CHECK (price >= 0),
    invoice_url VARCHAR(255), -- Reference to cloud storage invoice
    status CHAR(1) DEFAULT 'U' CHECK (status IN ('C', 'U')), -- C=Confirmed, U=Unconfirmed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE prealerts
ADD COLUMN s3_key VARCHAR(500);

-- Package Tracking Table
CREATE TABLE PackageTracking (
    tracking_id SERIAL PRIMARY KEY,
    package_id VARCHAR(10) NOT NULL REFERENCES Packages(package_id) ON DELETE CASCADE,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by INT REFERENCES Users(user_id), -- Admin who updated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE PackageTracking 
ALTER COLUMN location DROP NOT NULL;

-- Delivery Table (Separate from tracking)
CREATE TABLE Deliveries (
    delivery_id SERIAL PRIMARY KEY,
    package_id VARCHAR(10) NOT NULL REFERENCES Packages(package_id) ON DELETE CASCADE,
    delivered_at TIMESTAMP NOT NULL,
    received_by VARCHAR(100), -- Name of person who received
    --signature_url VARCHAR(255), -- URL to signature image
    delivered_by INT REFERENCES Users(user_id), -- Admin who delivered
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Deliveries
ALTER COLUMN delivered_at DROP NOT NULL


-- Shipments Table (For grouping packages)
CREATE TABLE Shipments (
    shipment_id SERIAL PRIMARY KEY,
    shipment_date DATE NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    carrier VARCHAR(50),
    tracking_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Package-Shipment Relationship Table (Many-to-Many)
CREATE TABLE PackageShipments (
    package_id VARCHAR(10) REFERENCES Packages(package_id) ON DELETE CASCADE,
    shipment_id INT REFERENCES Shipments(shipment_id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, shipment_id)
);

-- Payments Table
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Package-Payment Relationship Table
CREATE TABLE PackagePayments (
    package_id VARCHAR(10) REFERENCES Packages(package_id) ON DELETE CASCADE,
    payment_id INT REFERENCES Payments(payment_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    PRIMARY KEY (package_id, payment_id)
);

-- Transfers Table (for managing package transfers between locations)
CREATE TABLE Transfers (
    transfer_id SERIAL PRIMARY KEY,
    destination VARCHAR(50) NOT NULL CHECK (destination IN ('jamaica', 'priory-branch', 'ocho-rios-branch', 'overseas-warehouse')),
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'in_transit', 'delivered', 'cancelled')),
    notes TEXT,
    created_by INT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer-Package Relationship Table (Many-to-Many with checkoff tracking)
CREATE TABLE Transfer_Packages (
    transfer_id INT REFERENCES Transfers(transfer_id) ON DELETE CASCADE,
    package_id VARCHAR(10) REFERENCES Packages(package_id) ON DELETE CASCADE,
    checked_off BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transfer_id, package_id)
);

-- Staff Performance Tracking Table (for Super Admin analytics)
CREATE TABLE Staff_Performance (
    performance_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    packages_processed INT DEFAULT 0,
    transfers_created INT DEFAULT 0,
    customers_added INT DEFAULT 0,
    revenue_generated NUMERIC(12,2) DEFAULT 0.00,
    prealerts_confirmed INT DEFAULT 0,
    notifications_sent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, date) -- One record per staff per day
);

-- Daily Sales Summary Table (for quick analytics)
CREATE TABLE Daily_Sales_Summary (
    summary_id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_packages INT DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0.00,
    total_customers_added INT DEFAULT 0,
    total_transfers_created INT DEFAULT 0,
    total_prealerts_confirmed INT DEFAULT 0,
    active_staff_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date) -- One summary per day
);

-- Staff Actions Log Table (for detailed audit trail)
CREATE TABLE Staff_Actions_Log (
    log_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'package_created', 'transfer_created', 'customer_added', etc.
    entity_type VARCHAR(50), -- 'package', 'transfer', 'customer', etc.
    entity_id VARCHAR(50), -- ID of the entity being acted upon
    description TEXT,
    revenue_impact NUMERIC(10,2) DEFAULT 0.00,
    metadata JSONB, -- For storing additional action-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_packages_user_id ON Packages(user_id);
CREATE INDEX idx_packages_tracking_number ON Packages(tracking_number);
CREATE INDEX idx_prealerts_user_id ON PreAlerts(user_id);
CREATE INDEX idx_tracking_package_id ON PackageTracking(package_id);
CREATE INDEX idx_tracking_created_at ON PackageTracking(created_at);
CREATE INDEX idx_deliveries_package_id ON Deliveries(package_id);
CREATE INDEX idx_transfers_destination ON Transfers(destination);
CREATE INDEX idx_transfers_status ON Transfers(status);
CREATE INDEX idx_transfers_created_by ON Transfers(created_by);
CREATE INDEX idx_transfer_packages_transfer_id ON Transfer_Packages(transfer_id);
CREATE INDEX idx_transfer_packages_package_id ON Transfer_Packages(package_id);
CREATE INDEX idx_staff_performance_staff_id ON Staff_Performance(staff_id);
CREATE INDEX idx_staff_performance_date ON Staff_Performance(date);
CREATE INDEX idx_daily_sales_summary_date ON Daily_Sales_Summary(date);
CREATE INDEX idx_staff_actions_log_staff_id ON Staff_Actions_Log(staff_id);
CREATE INDEX idx_staff_actions_log_action_type ON Staff_Actions_Log(action_type);
CREATE INDEX idx_staff_actions_log_created_at ON Staff_Actions_Log(created_at);
