<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Índices para acelerar los filtros y el ordenamiento de la bitácora.
     */
    public function up(): void
    {
        Schema::table('auditorias', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('user_id');
            $table->index('accion');
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('auditorias', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['accion']);
            $table->dropIndex(['user_id', 'created_at']);
        });
    }
};
