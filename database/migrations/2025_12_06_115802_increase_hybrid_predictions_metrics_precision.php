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
            // Increase precision for MAPE (can be very large when actual values are small)
            // Change from decimal(8, 4) to decimal(12, 4) to support values up to 99,999,999.9999
            $table->decimal('mape', 12, 4)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hybrid_predictions', function (Blueprint $table) {
            $table->decimal('mape', 8, 4)->nullable()->change();
        });
    }
};
