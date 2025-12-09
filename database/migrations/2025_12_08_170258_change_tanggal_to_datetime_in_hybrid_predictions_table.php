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
        Schema::table('hybrid_predictions', function (Blueprint $table) {
            // Change tanggal from date to datetime to preserve time information
            $table->datetime('tanggal')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hybrid_predictions', function (Blueprint $table) {
            // Revert back to date (will lose time information)
            $table->date('tanggal')->change();
        });
    }
};
