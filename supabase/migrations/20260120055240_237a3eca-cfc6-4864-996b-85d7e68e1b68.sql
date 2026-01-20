-- Link Tristan's auth user_id to his company_users record for RoleColorFinder LLC
UPDATE company_users 
SET user_id = '894b90fd-4418-41cb-8364-45f0eeadb75a'
WHERE company_id = '0f03753c-ea99-4236-9f8c-16324b92f257' 
AND email = 'tristan@rolecolorfinder.com';