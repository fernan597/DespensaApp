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

        // Modificar columna tipo para soportar INGRESO_MANUAL y EGRESO_MANUAL según el motor (MySQL / PostgreSQL)
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE movimientos_caja MODIFY COLUMN tipo ENUM(
                'INGRESO_VENTA',
                'INGRESO_COBRO_CLIENTE',
                'EGRESO_PAGO_PROVEEDOR',
                'EGRESO_GASTO_VARIOS',
                'AJUSTE_MANUAL',
                'INGRESO_MANUAL',
                'EGRESO_MANUAL'
            ) NOT NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_tipo_check');
            DB::statement("ALTER TABLE movimientos_caja ADD CONSTRAINT movimientos_caja_tipo_check CHECK (tipo::text = ANY (ARRAY[
                'INGRESO_VENTA'::character varying,
                'INGRESO_COBRO_CLIENTE'::character varying,
                'EGRESO_PAGO_PROVEEDOR'::character varying,
                'EGRESO_GASTO_VARIOS'::character varying,
                'AJUSTE_MANUAL'::character varying,
                'INGRESO_MANUAL'::character varying,
                'EGRESO_MANUAL'::character varying
            ]::text[]))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE movimientos_caja MODIFY COLUMN tipo ENUM(
                'INGRESO_VENTA',
                'INGRESO_COBRO_CLIENTE',
                'EGRESO_PAGO_PROVEEDOR',
                'EGRESO_GASTO_VARIOS',
                'AJUSTE_MANUAL'
            ) NOT NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_tipo_check');
            DB::statement("ALTER TABLE movimientos_caja ADD CONSTRAINT movimientos_caja_tipo_check CHECK (tipo::text = ANY (ARRAY[
                'INGRESO_VENTA'::character varying,
                'INGRESO_COBRO_CLIENTE'::character varying,
                'EGRESO_PAGO_PROVEEDOR'::character varying,
                'EGRESO_GASTO_VARIOS'::character varying,
                'AJUSTE_MANUAL'::character varying
            ]::text[]))");
        }

        Schema::table('movimientos_caja', function (Blueprint $table) {
            if (Schema::hasColumn('movimientos_caja', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
