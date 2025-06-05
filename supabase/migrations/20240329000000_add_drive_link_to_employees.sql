-- Add drive_link column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS drive_link TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN employees.drive_link IS 'Google Drive folder link for employee documents'; 