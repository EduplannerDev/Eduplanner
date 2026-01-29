-- Add Tutoría to the allowed values for metodologia check constraint in planeaciones table
ALTER TABLE "planeaciones" DROP CONSTRAINT IF EXISTS "check_metodologia_valid";

ALTER TABLE "planeaciones" 
  ADD CONSTRAINT "check_metodologia_valid" 
  CHECK (metodologia IN ('NEM', 'CIME', 'Tutoría'));
