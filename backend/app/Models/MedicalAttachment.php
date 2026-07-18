<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

use Illuminate\Support\Facades\Storage;

#[Fillable(['medical_record_id', 'file_path'])]
class MedicalAttachment extends Model
{
    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class);
    }
}
