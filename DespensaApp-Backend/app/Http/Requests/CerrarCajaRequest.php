<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CerrarCajaRequest extends FormRequest
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
            'saldo_final' => 'required|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'saldo_final.required' => 'El saldo final es obligatorio.',
            'saldo_final.numeric'  => 'El saldo final debe ser un número.',
            'saldo_final.min'      => 'El saldo final no puede ser negativo.',
        ];
    }

    public function attributes(): array
    {
        return [
            'saldo_final' => 'saldo final',
        ];
    }
}
