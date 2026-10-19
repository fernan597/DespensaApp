<?php

namespace App\Exceptions;

use DomainException;

class CajaCerradaException extends DomainException
{
    public function __construct(
        string $message = 'No hay ninguna caja abierta para registrar movimientos. Debe abrir una caja primero.'
    ) {
        parent::__construct($message);
    }
}
