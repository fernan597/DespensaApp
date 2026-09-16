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
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_apertura_id')->constrained('users');
            $table->foreignId('usuario_cierre_id')->nullable()->constrained('users');
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->timestamp('fecha_cierre')->nullable();
            $table->decimal('saldo_inicial', 12, 2)->default(0.00);
            $table->decimal('saldo_final', 12, 2)->nullable();
            $table->enum('estado', ['ABIERTA', 'CERRADA'])->default('ABIERTA');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cajas');
    }
};
