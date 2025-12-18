-- Fix existing notification links in the database
-- This ensures that notifications already sent also point to the correct Director Dashboard

UPDATE app_notifications
SET link = '/?section=director-dashboard&tab=planeaciones'
WHERE link LIKE '%section=administracion-plantel%' 
AND title IN ('Nueva Planeación para Revisar', 'Planeación Re-enviada');
