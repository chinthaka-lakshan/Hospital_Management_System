<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class LogController extends Controller
{
    public function index()
    {
        // Use DIRECTORY_SEPARATOR for better Windows compatibility
        $logPath = storage_path('logs' . DIRECTORY_SEPARATOR . 'laravel.log');
        
        if (!File::exists($logPath)) {
            return response()->json(['logs' => 'No logs found.']);
        }

        // Use @ to suppress warnings if Windows strictly locks the file
        // Ignore new lines to make formatting cleaner when joining
        $file = @file($logPath);
        
        // If file() fails (returns false) due to Windows file locks or memory limits
        if ($file === false) {
            return response()->json([
                'logs' => "Unable to read logs. The file might be locked by another process or too large."
            ]);
        }

        // Return the last 500 lines of the log file to prevent massive memory usage
        $logs = array_slice($file, -500);
        
        return response()->json([
            'logs' => implode("", array_reverse($logs))
        ]);
    }
}
