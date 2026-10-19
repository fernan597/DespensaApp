<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AbrirCajaRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'saldo_inicial' => ['required', 'numeric', 'min:0', 'regex:/^\d+(\.\d{1,2})?$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'saldo_inicial.required' => 'El saldo inicial es obligatorio.',
            'saldo_inicial.numeric'  => 'El saldo inicial debe ser un número.',
            'saldo_inicial.min'      => 'El saldo inicial no puede ser negativo.',
            'saldo_inicial.regex'    => 'El saldo inicial debe tener como máximo 2 decimales.',
        ];
    }

    public function attributes(): array
    {
        return [
            'saldo_inicial' => 'saldo inicial',
        ];
    }
}
