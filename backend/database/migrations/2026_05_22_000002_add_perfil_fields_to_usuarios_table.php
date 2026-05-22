<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('foto_path')->nullable()->after('email');
            $table->string('telefono', 20)->nullable()->after('foto_path');
            $table->string('cargo', 100)->nullable()->after('telefono');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn(['foto_path', 'telefono', 'cargo']);
        });
    }
};
