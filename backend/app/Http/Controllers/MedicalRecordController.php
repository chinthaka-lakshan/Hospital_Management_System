<?php

namespace App\Http\Controllers;

use App\Models\MedicalRecord;
use App\Models\MedicalAttachment;
use Illuminate\Http\Request;
use App\Http\Requests\StoreMedicalRecordRequest;
use Illuminate\Support\Facades\Storage;

class MedicalRecordController extends Controller
{
    public function store(StoreMedicalRecordRequest $request)
    {
        // Must be a doctor to create records (enforced by middleware ideally, but let's be safe)
        $data = $request->validated();
        $data['doctor_id'] = $request->user()->id;

        $record = MedicalRecord::create($data);

        // Handle file attachments if any
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                // Save to default storage (will use 'public' locally or 's3' in production based on .env)
                $path = $file->store('medical_attachments');
                
                MedicalAttachment::create([
                    'medical_record_id' => $record->id,
                    'file_path' => $path,
                ]);
            }
        }

        return response()->json($record->load('attachments'), 201);
    }
}
