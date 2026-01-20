-- Clear assessment data for sanjay@rolecolorfinder.com in RoleColorFinder LLC so they can retake
UPDATE company_users 
SET assessment_result_id = NULL, assessment_completed_at = NULL 
WHERE id = 'bd1bb0d4-f5f3-4f14-b160-c94dcd7237a6';

-- Optionally delete the assessment result record
DELETE FROM assessment_results 
WHERE id = 'd1a86f03-a0ee-41d9-bb6f-063195a5bec7';