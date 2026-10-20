<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseVentaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas comunes de validación para cualquier tipo de venta.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items'               => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:products,id|distinct',
            'items.*.cantidad'    => 'required|integer|min:1',
        ];
    }

    /**
     * Mensajes comunes de error para los ítems de la venta.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required'               => 'Debe incluir al menos un producto en la venta.',
            'items.array'                  => 'El formato de los productos no es válido.',
            'items.min'                    => 'Debe incluir al menos un producto en la venta.',
            'items.*.producto_id.required' => 'El producto es obligatorio en cada ítem.',
            'items.*.producto_id.exists'   => 'Uno de los productos seleccionados no existe.',
            'items.*.producto_id.distinct' => 'No se puede repetir el mismo producto en los ítems de la venta.',
            'items.*.cantidad.required'    => 'La cantidad es obligatoria en cada ítem.',
            'items.*.cantidad.integer'     => 'La cantidad debe ser un número entero.',
            'items.*.cantidad.min'         => 'La cantidad mínima por ítem es 1.',
        ];
    }

    /**
     * Nombres amigables para los atributos comunes de la venta.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'items'               => 'productos',
            'items.*.producto_id' => 'producto',
            'items.*.cantidad'    => 'cantidad',
        ];
    }
}
