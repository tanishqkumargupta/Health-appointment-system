from datetime import datetime, time, timedelta
from extensions import db
from models.appointment import Appointment
from models.consultation import Consultation, Prescription, PrescriptionItem
from models.notification import Notification
from services.ai_service import generate_post_visit_ai_summary
from services.notification_service import create_notification

# Frequency to reminder time mapping (Section 26)
REMINDER_TIME_MAPPING = {
    "Morning": time(9, 0),
    "Afternoon": time(14, 0),
    "Evening": time(18, 0),
    "Night": time(21, 0)
}

def complete_consultation(doctor_user_id, appointment_id, diagnosis, clinical_notes, prescription_items_data):
    """
    Saves consultation diagnosis, notes, prescription items, enqueues medication reminders,
    generates post-visit AI summary, and marks appointment COMPLETED in a single atomic transaction.
    """
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        raise ValueError("Appointment not found.")

    if appointment.doctor.user_id != doctor_user_id:
        raise ValueError("Unauthorized: You are not assigned to this appointment.")

    if appointment.status == 'COMPLETED':
        raise ValueError("Consultation has already been completed for this appointment.")

    # Atomic DB transaction start
    try:
        # Create Consultation record
        consultation = Consultation(
            appointment_id=appointment.id,
            diagnosis=diagnosis.strip(),
            clinical_notes=clinical_notes.strip() if clinical_notes else None,
            ai_status='PENDING'
        )
        db.session.add(consultation)
        db.session.flush()

        # Create Prescription record
        prescription = Prescription(
            consultation_id=consultation.id,
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
            patient_id=appointment.patient_id
        )
        db.session.add(prescription)
        db.session.flush()

        # Add Prescription Items
        items_dict_list = []
        for item in prescription_items_data:
            med_name = item.get("medicine_name", "").strip()
            dosage = item.get("dosage", "").strip()
            food_inst = item.get("food_instruction", "After food").strip()
            frequencies = item.get("frequency", [])
            duration = item.get("duration", "").strip()

            if not med_name or not dosage:
                raise ValueError("Medicine name and dosage are required for each prescription item.")

            p_item = PrescriptionItem(
                prescription_id=prescription.id,
                medicine_name=med_name,
                dosage=dosage,
                food_instruction=food_inst,
                frequency=frequencies,
                duration=duration
            )
            db.session.add(p_item)
            items_dict_list.append({
                "medicine_name": med_name,
                "dosage": dosage,
                "food_instruction": food_inst,
                "frequency": frequencies,
                "duration": duration
            })

        # Update appointment status to COMPLETED
        appointment.status = 'COMPLETED'
        db.session.flush()

        # Generate Post-Visit AI Summary (Rule 30)
        ai_summary_text, ai_status = generate_post_visit_ai_summary(
            diagnosis,
            clinical_notes,
            items_dict_list
        )
        consultation.post_visit_ai_summary = ai_summary_text
        consultation.ai_status = ai_status

        # Create Medication Reminder Notifications (Rule 26)
        patient_id = appointment.patient_id
        for item in items_dict_list:
            for freq in item["frequency"]:
                if freq in REMINDER_TIME_MAPPING:
                    rem_time = REMINDER_TIME_MAPPING[freq].strftime("%I:%M %p")
                    create_notification(
                        user_id=patient_id,
                        notif_type='MEDICATION_REMINDER',
                        title=f"Medication Reminder ({freq} - {rem_time})",
                        message=f"Take {item['medicine_name']} ({item['dosage']}) {item['food_instruction']}."
                    )

        # Create Feedback Reminder Notification (Rule 39)
        create_notification(
            user_id=patient_id,
            notif_type='FEEDBACK_REMINDER',
            title="How was your consultation?",
            message=f"Please provide feedback for your visit with Dr. {appointment.doctor.user.name}."
        )

        db.session.commit()
        return consultation

    except Exception as e:
        db.session.rollback()
        raise e
