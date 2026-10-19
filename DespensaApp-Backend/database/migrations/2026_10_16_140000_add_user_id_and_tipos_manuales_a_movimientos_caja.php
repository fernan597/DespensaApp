<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movimientos_caja', function (Blueprint $table) {
            if (!Schema::hasColumn('movimientos_caja', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('caja_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        // Modificar columna tipo para soportar INGRESO_MANUAL y EGRESO_MANUAL si el motor es MySQL
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE movimientos_caja MODIFY COLUMN tipo ENUM(
                'INGRESO_VENTA',
                'INGRESO_COBRO_CLIENTE',
                'EGRESO_PAGO_PROVEEDOR',
                'EGRESO_GASTO_VARIOS',
                'AJUSTE_MANUAL',
                'INGRESO_MANUAL',
                'EGRESO_MANUAL'
            ) NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE movimientos_caja MODIFY COLUMN tipo ENUM(
                'INGRESO_VENTA',
                'INGRESO_COBRO_CLIENTE',
                'EGRESO_PAGO_PROVEEDOR',
                'EGRESO_GASTO_VARIOS',
                'AJUSTE_MANUAL'
            ) NOT NULL");
        }

        Schema::table('movimientos_caja', function (Blueprint $table) {
            if (Schema::hasColumn('movimientos_caja', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
