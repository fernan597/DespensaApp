<?php

namespace App\Enums;

enum MedioPago: string
{
    case EFECTIVO = 'EFECTIVO';
    case TRANSFERENCIA = 'TRANSFERENCIA';
    case DEBITO = 'DEBITO';
    case CREDITO = 'CREDITO';
}
