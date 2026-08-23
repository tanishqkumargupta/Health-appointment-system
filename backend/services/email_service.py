import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import Config
from extensions import db
from models.notification import Notification

def send_email_direct(to_email, subject, body_text):
    """
    Sends an SMTP email directly using configured settings.
    Throws Exception on failure.
    """
    host = Config.EMAIL_HOST
    port = Config.EMAIL_PORT
    username = Config.EMAIL_USERNAME
    password = Config.EMAIL_PASSWORD

    if not username or not password or username == "your_email@example.com":
        print(f"[Email Service Simulator] Would send email to {to_email}: Subject: '{subject}'")
        return True

    msg = MIMEMultipart()
    msg['From'] = username
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body_text, 'plain'))

    server = smtplib.SMTP(host, port, timeout=10)
    server.starttls()
    server.login(username, password)
    server.sendmail(username, to_email, msg.as_string())
    server.quit()
    return True

def process_pending_email_jobs(max_jobs=10):
    """
    Background worker task to process pending notification email jobs with retries.
    """
    pending = Notification.query.filter(
        Notification.status.in_(['PENDING', 'FAILED']),
        Notification.attempts < 3
    ).limit(max_jobs).all()

    for job in pending:
        try:
            job.attempts += 1
            user_email = job.user.email if job.user else None
            if user_email:
                send_email_direct(user_email, job.title, job.message)
            job.status = 'SENT'
            job.sent_at = datetime.utcnow()
            job.last_error = None
        except Exception as e:
            job.status = 'FAILED'
            job.last_error = str(e)
            print(f"[Email Retry Error] Job {job.id} failed attempt {job.attempts}: {e}")

    if pending:
        db.session.commit()
