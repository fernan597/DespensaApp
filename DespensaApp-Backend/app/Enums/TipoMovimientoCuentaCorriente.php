<?php

namespace App\Enums;

enum TipoMovimientoCuentaCorriente: string
{
    case DEBITO = 'DEBITO';
    case CREDITO = 'CREDITO';
}
