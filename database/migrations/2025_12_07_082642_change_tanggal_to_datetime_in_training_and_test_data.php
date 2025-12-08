<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('training_data', function (Blueprint $table) {
            $table->datetime('tanggal')->change();
        });

        Schema::table('test_data', function (Blueprint $table) {
            $table->datetime('tanggal')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_data', function (Blueprint $table) {
            $table->date('tanggal')->change();
        });

        Schema::table('test_data', function (Blueprint $table) {
            $table->date('tanggal')->change();
        });
    }
};
