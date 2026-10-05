<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            $table->boolean('activo')->default(true)->after('saldo_adeudado');
        });

        Schema::table('compras', function (Blueprint $table) {
            $table->string('numero_comprobante', 100)->nullable()->after('proveedor_id');
            $table->unique(['proveedor_id', 'numero_comprobante']);
        });

        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->foreignId('compra_id')
                ->nullable()
                ->after('pago_proveedor_id')
                ->constrained('compras')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->dropConstrainedForeignId('compra_id');
        });

        Schema::table('compras', function (Blueprint $table) {
            $table->dropUnique(['proveedor_id', 'numero_comprobante']);
            $table->dropColumn('numero_comprobante');
        });

        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropColumn('activo');
        });
    }
};
