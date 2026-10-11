<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCobroClienteRequest extends FormRequest
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
            'cliente_id' => 'required|integer|exists:clientes,id',
            'monto'      => 'required|numeric|gt:0',
            'medio_pago' => 'required|string|in:EFECTIVO,TRANSFERENCIA,DEBITO,CREDITO',
        ];
    }

    public function messages(): array
    {
        return [
            'cliente_id.required' => 'Debe seleccionar un cliente para registrar el cobro.',
            'cliente_id.integer'  => 'El identificador de cliente debe ser un valor entero.',
            'cliente_id.exists'   => 'El cliente seleccionado no existe en el sistema.',
            'monto.required'      => 'El monto a cobrar es obligatorio.',
            'monto.numeric'       => 'El monto a cobrar debe ser numérico.',
            'monto.gt'            => 'El monto a cobrar debe ser mayor a 0.',
            'medio_pago.required' => 'Debe especificar el medio de pago utilizado.',
            'medio_pago.string'   => 'El medio de pago debe ser una cadena de texto.',
            'medio_pago.in'       => 'El medio de pago no es válido. Debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO.',
        ];
    }

    public function attributes(): array
    {
        return [
            'cliente_id' => 'cliente',
            'monto'      => 'monto',
            'medio_pago' => 'medio de pago',
        ];
    }
}
