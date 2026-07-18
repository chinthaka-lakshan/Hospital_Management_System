<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class LogController extends Controller
{
    public function index()
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!File::exists($logPath)) {
            return response()->json(['logs' => 'No logs found.']);
        }

        // Return the last 500 lines of the log file to prevent massive memory usage
        $file = file($logPath);
        $logs = array_slice($file, -500);
        
        return response()->json([
            'logs' => implode("", array_reverse($logs))
        ]);
    }
}
