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
        Schema::create('movimientos_cuenta_corriente_proveedores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->enum('tipo_movimiento', ['DEBITO', 'CREDITO']); // DEBITO: genera deuda (compra), CREDITO: cancela deuda (pago)
            $table->foreignId('compra_id')->nullable()->constrained('compras')->nullOnDelete();
            $table->foreignId('pago_proveedor_id')->nullable()->constrained('pagos_proveedores')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_cuenta_corriente_proveedores');
    }
};
