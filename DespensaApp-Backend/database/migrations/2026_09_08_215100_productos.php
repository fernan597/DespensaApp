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
        Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->string('nombre');
        $table->string('codigo_barra');
        $table->integer('stock_actual');
        $table->integer('stock_minimo');
        $table->decimal('precio_compra');
        $table->decimal('precio_venta');

        $table->unsignedBigInteger('categoria_id');
        $table->unsignedBigInteger('marca_id');

        $table->foreign('categoria_id')->references('id')->on('categories');
        $table->foreign('marca_id')->references('id')->on('marcas');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
