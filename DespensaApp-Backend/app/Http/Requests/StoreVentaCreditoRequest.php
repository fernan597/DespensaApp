<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVentaCreditoRequest extends FormRequest
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
            'cliente_id'          => 'required|exists:clientes,id',
            'items'               => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:products,id',
            'items.*.cantidad'    => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'cliente_id.required'           => 'Debe seleccionar un cliente para registrar una venta a crédito.',
            'cliente_id.exists'             => 'El cliente seleccionado no existe en el sistema.',
            'items.required'                => 'Debe incluir al menos un producto en la venta.',
            'items.array'                   => 'El formato de los productos no es válido.',
            'items.min'                     => 'Debe incluir al menos un producto en la venta.',
            'items.*.producto_id.required'  => 'El producto es obligatorio en cada ítem.',
            'items.*.producto_id.exists'    => 'Uno de los productos seleccionados no existe.',
            'items.*.cantidad.required'     => 'La cantidad es obligatoria en cada ítem.',
            'items.*.cantidad.integer'      => 'La cantidad debe ser un número entero.',
            'items.*.cantidad.min'          => 'La cantidad mínima por ítem es 1.',
        ];
    }

    public function attributes(): array
    {
        return [
            'cliente_id'          => 'cliente',
            'items'               => 'productos',
            'items.*.producto_id' => 'producto',
            'items.*.cantidad'    => 'cantidad',
        ];
    }
}
