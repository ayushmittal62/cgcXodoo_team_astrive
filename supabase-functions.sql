-- SQL Functions for Organizer Dashboard Analytics
-- Run these in your Supabase SQL Editor

-- Function to get revenue by period (daily, weekly, monthly)
CREATE OR REPLACE FUNCTION get_revenue_by_period(
  organizer_id UUID,
  date_format TEXT,
  period_interval TEXT
)
RETURNS TABLE(
  period_label TEXT,
  total_revenue NUMERIC,
  total_bookings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(b.created_at, date_format) as period_label,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    COUNT(b.id) as total_bookings
  FROM bookings b
  JOIN events e ON b.event_id = e.id
  WHERE e.organizer_id = get_revenue_by_period.organizer_id
    AND b.booking_status = 'confirmed'
    AND b.created_at >= NOW() - period_interval::INTERVAL
  GROUP BY TO_CHAR(b.created_at, date_format)
  ORDER BY period_label DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get organizer dashboard summary
CREATE OR REPLACE FUNCTION get_organizer_dashboard_summary(organizer_id UUID)
RETURNS TABLE(
  total_events BIGINT,
  total_revenue NUMERIC,
  total_bookings BIGINT,
  total_attendees BIGINT,
  active_events BIGINT,
  draft_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM events WHERE events.organizer_id = get_organizer_dashboard_summary.organizer_id) as total_events,
    (SELECT COALESCE(SUM(b.total_amount), 0) 
     FROM bookings b 
     JOIN events e ON b.event_id = e.id 
     WHERE e.organizer_id = get_organizer_dashboard_summary.organizer_id 
       AND b.booking_status = 'confirmed') as total_revenue,
    (SELECT COUNT(*) 
     FROM bookings b 
     JOIN events e ON b.event_id = e.id 
     WHERE e.organizer_id = get_organizer_dashboard_summary.organizer_id 
       AND b.booking_status = 'confirmed') as total_bookings,
    (SELECT COALESCE(SUM(ba.quantity), 0)
     FROM booking_attendees ba
     JOIN bookings b ON ba.booking_id = b.id
     JOIN events e ON b.event_id = e.id
     WHERE e.organizer_id = get_organizer_dashboard_summary.organizer_id) as total_attendees,
    (SELECT COUNT(*) FROM events WHERE events.organizer_id = get_organizer_dashboard_summary.organizer_id AND status = 'published') as active_events,
    (SELECT COUNT(*) FROM events WHERE events.organizer_id = get_organizer_dashboard_summary.organizer_id AND status = 'draft') as draft_events;
END;
$$ LANGUAGE plpgsql;

-- Function to get ticket sales by period
CREATE OR REPLACE FUNCTION get_ticket_sales_by_period(
  organizer_id UUID,
  date_format TEXT,
  period_interval TEXT
)
RETURNS TABLE(
  period_label TEXT,
  total_tickets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(b.created_at, date_format) as period_label,
    COALESCE(SUM(b.quantity), 0) as total_tickets
  FROM bookings b
  JOIN events e ON b.event_id = e.id
  WHERE e.organizer_id = get_ticket_sales_by_period.organizer_id
    AND b.booking_status = 'confirmed'
    AND b.created_at >= NOW() - period_interval::INTERVAL
  GROUP BY TO_CHAR(b.created_at, date_format)
  ORDER BY period_label DESC;
END;
$$ LANGUAGE plpgsql;

-- Update event analytics function (to be called after each booking)
CREATE OR REPLACE FUNCTION update_event_analytics(event_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO event_analytics (event_id, total_views, total_bookings, total_revenue)
  VALUES (event_id, 0, 0, 0)
  ON CONFLICT (event_id) 
  DO UPDATE SET
    total_bookings = (
      SELECT COUNT(*) 
      FROM bookings 
      WHERE bookings.event_id = update_event_analytics.event_id 
        AND booking_status = 'confirmed'
    ),
    total_revenue = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM bookings 
      WHERE bookings.event_id = update_event_analytics.event_id 
        AND booking_status = 'confirmed'
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics on booking changes
CREATE OR REPLACE FUNCTION trigger_update_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_event_analytics(NEW.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_analytics_on_booking ON bookings;
CREATE TRIGGER update_analytics_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_event_analytics();
