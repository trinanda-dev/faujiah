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
        // Tambahkan kolom id_data ke training_data
        Schema::table('training_data', function (Blueprint $table) {
            $table->unsignedBigInteger('id_data')->nullable()->after('id');
            $table->foreign('id_data')->references('id_data')->on('tb_data')->onDelete('cascade');
        });

        // Tambahkan kolom id_data ke validation_data
        Schema::table('validation_data', function (Blueprint $table) {
            $table->unsignedBigInteger('id_data')->nullable()->after('id');
            $table->foreign('id_data')->references('id_data')->on('tb_data')->onDelete('cascade');
        });

        // Tambahkan kolom id_data ke test_data
        Schema::table('test_data', function (Blueprint $table) {
            $table->unsignedBigInteger('id_data')->nullable()->after('id');
            $table->foreign('id_data')->references('id_data')->on('tb_data')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Hapus foreign key dan kolom id_data dari test_data
        Schema::table('test_data', function (Blueprint $table) {
            $table->dropForeign(['id_data']);
            $table->dropColumn('id_data');
        });

        // Hapus foreign key dan kolom id_data dari validation_data
        Schema::table('validation_data', function (Blueprint $table) {
            $table->dropForeign(['id_data']);
            $table->dropColumn('id_data');
        });

        // Hapus foreign key dan kolom id_data dari training_data
        Schema::table('training_data', function (Blueprint $table) {
            $table->dropForeign(['id_data']);
            $table->dropColumn('id_data');
        });
    }
};
