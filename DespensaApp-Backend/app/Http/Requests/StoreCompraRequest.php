<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompraRequest extends FormRequest
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
            'proveedor_id'          => [
                'required',
                Rule::exists('proveedores', 'id')->where(function ($query) {
                    $query->where('activo', true);
                }),
            ],
            'tipo_pago'             => 'required|in:CONTADO,CREDITO,CUENTA_CORRIENTE',
            'numero_comprobante'    => 'nullable|string|max:100',
            'items'                 => 'required|array|min:1',
            'items.*.producto_id'   => 'required|exists:products,id|distinct',
            'items.*.cantidad'      => 'required|integer|min:1',
            'items.*.costo_unitario'=> 'required|numeric|gt:0',
        ];
    }

    public function messages(): array
    {
        return [
            'proveedor_id.required'         => 'Debe seleccionar un proveedor.',
            'proveedor_id.exists'           => 'El proveedor seleccionado no existe o se encuentra inactivo.',
            'tipo_pago.required'            => 'El tipo de pago es obligatorio.',
            'tipo_pago.in'                  => 'El tipo de pago debe ser CONTADO o CRÉDITO.',
            'items.required'                => 'Debe incluir al menos un producto en la compra.',
            'items.array'                   => 'El formato de los productos no es válido.',
            'items.min'                     => 'Debe incluir al menos un producto en la compra.',
            'items.*.producto_id.required'  => 'El producto es obligatorio en cada ítem.',
            'items.*.producto_id.exists'    => 'Uno de los productos seleccionados no existe.',
            'items.*.producto_id.distinct'  => 'No puede repetir el mismo producto varias veces en la compra.',
            'items.*.cantidad.required'     => 'La cantidad es obligatoria en cada ítem.',
            'items.*.cantidad.integer'      => 'La cantidad debe ser un número entero.',
            'items.*.cantidad.min'          => 'La cantidad mínima por ítem es 1.',
            'items.*.costo_unitario.required' => 'El costo unitario es obligatorio en cada ítem.',
            'items.*.costo_unitario.numeric'  => 'El costo unitario debe ser un número válido.',
            'items.*.costo_unitario.gt'       => 'El costo unitario debe ser mayor a 0.',
        ];
    }

    public function attributes(): array
    {
        return [
            'proveedor_id'          => 'proveedor',
            'tipo_pago'             => 'tipo de pago',
            'numero_comprobante'    => 'número de comprobante',
            'items'                 => 'productos',
            'items.*.producto_id'   => 'producto',
            'items.*.cantidad'      => 'cantidad',
            'items.*.costo_unitario'=> 'costo unitario',
        ];
    }
}
