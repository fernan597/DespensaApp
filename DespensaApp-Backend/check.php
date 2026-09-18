<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- VENTAS ---" . PHP_EOL;
$ventas = App\Models\Venta::all();
foreach ($ventas as $v) {
    echo "ID: {$v->id} | Total: {$v->total} | Medio: {$v->medio_pago} | Estado: {$v->estado}" . PHP_EOL;
}

echo "--- MOVIMIENTOS CAJA ---" . PHP_EOL;
$movs = App\Models\MovimientoCaja::all();
foreach ($movs as $m) {
    echo "ID: {$m->id} | Caja: {$m->caja_id} | Tipo: {$m->tipo} | Monto: {$m->monto} | Venta: {$m->venta_id} | Concepto: {$m->concepto}" . PHP_EOL;
}
