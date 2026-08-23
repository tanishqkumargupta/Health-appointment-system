from datetime import datetime, time, timedelta

def parse_time_str(time_str):
    """
    Parses strings like '18:00', '06:00 PM', '18:30:00' into datetime.time object.
    """
    if isinstance(time_str, time):
        return time_str
    
    formats = ["%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p"]
    for fmt in formats:
        try:
            return datetime.strptime(time_str.strip(), fmt).time()
        except ValueError:
            pass
    raise ValueError(f"Invalid time format: {time_str}")

def format_time_str(time_obj):
    """Formats datetime.time or datetime into 'HH:MM' string."""
    if isinstance(time_obj, time):
        return time_obj.strftime("%H:%M")
    elif isinstance(time_obj, datetime):
        return time_obj.strftime("%H:%M")
    return str(time_obj)

def get_shift_datetimes(base_date, start_time_obj, end_time_obj):
    """
    Given a base date (datetime.date) and start/end time objects,
    returns (shift_start_datetime, shift_end_datetime).
    Handles overnight shifts (e.g. 18:00 to 02:00 next morning).
    """
    shift_start = datetime.combine(base_date, start_time_obj)
    
    if end_time_obj > start_time_obj:
        # Same day shift (e.g. 09:00 to 17:00)
        shift_end = datetime.combine(base_date, end_time_obj)
    else:
        # Overnight shift (e.g. 18:00 to 02:00) -> end time is on next date
        shift_end = datetime.combine(base_date + timedelta(days=1), end_time_obj)
        
    return shift_start, shift_end

def check_time_overlap(start1, end1, start2, end2):
    """
    Checks if time interval [start1, end1) overlaps with [start2, end2).
    """
    return max(start1, start2) < min(end1, end2)
