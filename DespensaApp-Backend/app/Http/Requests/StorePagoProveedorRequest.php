<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePagoProveedorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'proveedor_id' => 'required|integer|exists:proveedores,id',
            'monto'        => 'required|numeric|gt:0|decimal:0,2',
            'medio_pago'   => 'required|string|in:EFECTIVO,TRANSFERENCIA,DEBITO, CREDITO',
        ];
    }

    public function messages(): array
    {
        return [
            'proveedor_id.required' => 'Debe seleccionar un proveedor para registrar el pago.',
            'proveedor_id.integer'  => 'El identificador de proveedor debe ser un valor entero.',
            'proveedor_id.exists'   => 'El proveedor seleccionado no existe en el sistema.',
            'monto.required'        => 'El monto a pagar es obligatorio.',
            'monto.numeric'         => 'El monto a pagar debe ser numérico.',
            'monto.gt'              => 'El monto a pagar debe ser mayor a 0.',
            'medio_pago.required'   => 'Debe especificar el medio de pago utilizado.',
            'medio_pago.string'     => 'El medio de pago debe ser una cadena de texto.',
            'medio_pago.in'         => 'El medio de pago no es válido. Debe ser EFECTIVO, TRANSFERENCIA, DEBITO.',
        ];
    }

    public function attributes(): array
    {
        return [
            'proveedor_id' => 'proveedor',
            'monto'        => 'monto',
            'medio_pago'   => 'medio de pago',
        ];
    }
}
