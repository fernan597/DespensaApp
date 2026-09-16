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
        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caja_id')->constrained('cajas')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->enum('tipo', [
                'INGRESO_VENTA',
                'INGRESO_COBRO_CLIENTE',
                'EGRESO_PAGO_PROVEEDOR',
                'EGRESO_GASTO_VARIOS',
                'AJUSTE_MANUAL'
            ]);
            $table->string('concepto', 255);
            $table->foreignId('venta_id')->nullable()->constrained('ventas')->nullOnDelete();
            $table->foreignId('cobro_cliente_id')->nullable()->constrained('cobros_clientes')->nullOnDelete();
            $table->foreignId('pago_proveedor_id')->nullable()->constrained('pagos_proveedores')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_caja');
    }
};
