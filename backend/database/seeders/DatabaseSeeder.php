<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('adminpassword'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Dr. Kamal Perera',
            'email' => 'doctor@gmail.com',
            'password' => Hash::make('doctorpassword'),
            'role' => 'doctor',
        ]);

        User::create([
            'name' => 'Avishka Devindi',
            'email' => 'reception@gmail.com',
            'password' => Hash::make('receptionpassword'),
            'role' => 'receptionist',
        ]);
    }
}
