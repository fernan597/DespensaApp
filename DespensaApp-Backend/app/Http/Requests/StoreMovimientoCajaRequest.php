<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMovimientoCajaRequest extends FormRequest
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
            'tipo'     => 'required|string|in:INGRESO,EGRESO,INGRESO_MANUAL,EGRESO_MANUAL',
            'monto'    => 'required|numeric|gt:0|decimal:0,2',
            'concepto' => 'required|string|min:3|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required'     => 'El tipo de movimiento es obligatorio.',
            'tipo.in'           => 'El tipo de movimiento debe ser INGRESO o EGRESO.',
            'monto.required'    => 'El monto es obligatorio.',
            'monto.numeric'     => 'El monto debe ser un valor numérico.',
            'monto.gt'          => 'El monto debe ser mayor a 0.',
            'monto.decimal'     => 'El monto debe tener como máximo 2 decimales.',
            'concepto.required' => 'El concepto descriptivo es obligatorio.',
            'concepto.min'      => 'El concepto debe contener al menos 3 caracteres.',
            'concepto.max'      => 'El concepto no puede superar los 255 caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'tipo'     => 'tipo de movimiento',
            'monto'    => 'monto',
            'concepto' => 'concepto descriptivo',
        ];
    }
}
