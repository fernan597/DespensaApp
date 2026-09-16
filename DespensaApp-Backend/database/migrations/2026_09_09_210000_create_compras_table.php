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
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('proveedor_id')->constrained('proveedores');
            $table->decimal('total', 12, 2)->default(0.00);
            $table->enum('tipo_pago', ['CONTADO', 'CUENTA_CORRIENTE'])->default('CONTADO');
            $table->boolean('pendiente_pago')->default(false);
            $table->string('estado', 50)->default('RECIBIDA');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compras');
    }
};
