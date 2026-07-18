<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\MedicalRecordController;

use App\Http\Controllers\UserController;
use App\Http\Controllers\LogController;

// Public auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Admin & Receptionist only routes
    Route::middleware('role:admin,receptionist')->group(function () {
        Route::post('appointments', [AppointmentController::class, 'store']);
        
        Route::get('doctors', function () {
            return response()->json(\App\Models\User::where('role', 'doctor')->get(['id', 'name']));
        });
    });

    // Everyone can access patients (create/update/delete restricted in controller/requests)
    Route::apiResource('patients', PatientController::class);

    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('logs', [LogController::class, 'index']);
    });

    // Doctor, Admin & Receptionist routes (everyone can update appointments depending on context)
    Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);

    // Doctor & Admin routes
    Route::middleware('role:admin,doctor')->group(function () {
        Route::post('medical-records', [MedicalRecordController::class, 'store']);
    });

    // Routes accessible by multiple roles (Doctor sees own, Receptionist/Admin see all)
    Route::get('appointments', [AppointmentController::class, 'index']);
});
