<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use App\Http\Requests\StoreAppointmentRequest;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'doctor']);

        // Doctors see only their own appointments
        if ($request->user()->role === 'doctor') {
            $query->where('doctor_id', $request->user()->id)
                  ->where('status', '!=', 'canceled');
        }

        return response()->json($query->orderBy('appointment_date', 'asc')->get());
    }

    public function store(StoreAppointmentRequest $request)
    {
        $appointment = Appointment::create($request->validated());
        return response()->json($appointment->load(['patient', 'doctor']), 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        // For example, changing status to 'completed' or 'canceled'
        $appointment->update($request->only(['status', 'notes']));
        return response()->json($appointment);
    }
}
