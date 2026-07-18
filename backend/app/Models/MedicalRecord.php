<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['appointment_id', 'patient_id', 'doctor_id', 'diagnosis', 'prescription'])]
class MedicalRecord extends Model
{
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function attachments()
    {
        return $this->hasMany(MedicalAttachment::class);
    }
}
