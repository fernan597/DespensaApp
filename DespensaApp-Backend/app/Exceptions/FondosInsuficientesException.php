<?php

namespace App\Exceptions;

class FondosInsuficientesException extends PagoProveedorException
{
    public function __construct(
        string $message = 'Fondos insuficientes en la caja activa para registrar el pago en efectivo.',
        protected ?array $detalle = null
    ) {
        parent::__construct($message);
    }

    public function getDetalle(): ?array
    {
        return $this->detalle;
    }
}
