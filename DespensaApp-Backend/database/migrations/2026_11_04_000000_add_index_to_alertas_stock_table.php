<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alertas_stock', function (Blueprint $table) {
            $table->index(['product_id', 'atendida'], 'alertas_stock_producto_atendida_index');
        });
    }

    public function down(): void
    {
        Schema::table('alertas_stock', function (Blueprint $table) {
            $table->dropIndex('alertas_stock_producto_atendida_index');
        });
    }
};
