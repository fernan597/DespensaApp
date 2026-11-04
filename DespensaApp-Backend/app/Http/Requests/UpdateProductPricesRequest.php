<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductPricesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin_despensa') ?? false;
    }

    public function rules(): array
    {
        return [
            'modo' => ['required', 'string', Rule::in(['individual', 'masivo'])],

            // Modo Individual
            'product_id' => [
                'required_if:modo,individual',
                'nullable',
                'integer',
            ],
            'precio_compra' => [
                'required_if:modo,individual',
                'nullable',
                'numeric',
                'min:0',
            ],
            'precio_venta' => [
                'required_if:modo,individual',
                'nullable',
                'numeric',
                'gt:0',
            ],

            // Modo Masivo
            'filtro_tipo' => [
                'required_if:modo,masivo',
                'nullable',
                'string',
                Rule::in(['categoria', 'marca', 'todos']),
            ],
            'categoria_id' => [
                'required_if:filtro_tipo,categoria',
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->whereNull('deleted_at'),
            ],
            'marca_id' => [
                'required_if:filtro_tipo,marca',
                'nullable',
                'integer',
                Rule::exists('marcas', 'id')->whereNull('deleted_at'),
            ],
            'tipo_ajuste' => [
                'required_if:modo,masivo',
                'nullable',
                'string',
                Rule::in(['porcentaje_aumento', 'fijar_margen']),
            ],
            'valor_porcentaje' => [
                'required_if:modo,masivo',
                'nullable',
                'numeric',
                'min:-95',
                'max:1000',
            ],
            'actualizar_costo' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'modo.required'                 => 'El modo de actualización es obligatorio.',
            'modo.in'                       => 'El modo debe ser individual o masivo.',
            'product_id.required_if'        => 'Debe seleccionar un producto.',
            'product_id.integer'            => 'El producto seleccionado no es válido.',
            'product_id.exists'             => 'El producto seleccionado no existe.',
            'precio_compra.required_if'     => 'El precio de compra es obligatorio.',
            'precio_compra.min'             => 'El precio de compra no puede ser negativo.',
            'precio_venta.required_if'      => 'El precio de venta es obligatorio.',
            'precio_venta.numeric'          => 'El precio de venta debe ser un valor numérico.',
            'precio_venta.gt'               => 'El precio de venta debe ser mayor a 0.',
            'filtro_tipo.required_if'       => 'Debe seleccionar el alcance de la actualización masiva.',
            'categoria_id.required_if'      => 'Debe seleccionar una categoría.',
            'marca_id.required_if'          => 'Debe seleccionar una marca.',
            'tipo_ajuste.required_if'       => 'Debe indicar el tipo de ajuste a aplicar.',
            'valor_porcentaje.required_if'  => 'Debe ingresar el porcentaje a aplicar.',
            'valor_porcentaje.numeric'      => 'El porcentaje debe ser un valor numérico.',
            'valor_porcentaje.min'          => 'El porcentaje no puede ser menor a -95%.',
            'valor_porcentaje.max'          => 'El porcentaje no puede ser mayor a 1000%.',
        ];
    }
}

