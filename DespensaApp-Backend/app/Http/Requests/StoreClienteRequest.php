<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreClienteRequest extends FormRequest
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
            'nombre'    => 'required|string|max:100',
            'apellido'  => 'nullable|string|max:100',
            'telefono'  => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'  => 'El nombre es obligatorio.',
            'nombre.string'    => 'El nombre debe ser texto.',
            'nombre.max'       => 'El nombre no puede superar los 100 caracteres.',
            'apellido.string'  => 'El apellido debe ser texto.',
            'apellido.max'     => 'El apellido no puede superar los 100 caracteres.',
            'telefono.string'  => 'El teléfono debe ser texto.',
            'telefono.max'     => 'El teléfono no puede superar los 50 caracteres.',
            'direccion.string' => 'La dirección debe ser texto.',
            'direccion.max'    => 'La dirección no puede superar los 255 caracteres.',
        ];
    }
}
