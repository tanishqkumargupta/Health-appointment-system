from extensions import db

class Specialization(db.Model):
    __tablename__ = 'specializations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)

    doctors = db.relationship('Doctor', backref='specialization')
    issue_categories = db.relationship('PatientIssueCategory', backref='specialization')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }


class PatientIssueCategory(db.Model):
    __tablename__ = 'patient_issue_categories'

    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), unique=True, nullable=False) # e.g. Skin, Heart / Chest, etc.
    specialization_id = db.Column(db.Integer, db.ForeignKey('specializations.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "category_name": self.category_name,
            "specialization_id": self.specialization_id,
            "specialization_name": self.specialization.name if self.specialization else None
        }
