<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_data', function (Blueprint $table) {
            if (Schema::hasColumn('training_data', 'tinggi_gelombang_normalized')) {
                $table->dropColumn('tinggi_gelombang_normalized');
            }
            if (Schema::hasColumn('training_data', 'kecepatan_angin_normalized')) {
                $table->dropColumn('kecepatan_angin_normalized');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_data', function (Blueprint $table) {
            if (! Schema::hasColumn('training_data', 'tinggi_gelombang_normalized')) {
                $table->decimal('tinggi_gelombang_normalized', 10, 6)->nullable()->after('tinggi_gelombang');
            }
            if (! Schema::hasColumn('training_data', 'kecepatan_angin_normalized')) {
                $table->decimal('kecepatan_angin_normalized', 10, 6)->nullable()->after('kecepatan_angin');
            }
        });
    }
};
