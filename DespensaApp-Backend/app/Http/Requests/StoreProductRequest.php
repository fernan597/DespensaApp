<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'codigo_barra' => 'required|string|max:255',
            'stock_actual' => 'required|integer',
            'stock_minimo' => 'required|integer',
            'precio_compra' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'categoria_id' => 'required|exists:categories,id',
            'marca_nombre' => 'required_without:marca_id|nullable|string|max:255',
            'marca_id' => 'nullable|exists:marcas,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser texto.',
            'name.max' => 'El nombre no puede exceder 255 caracteres.',
            'codigo_barra.required' => 'El código de barras es obligatorio.',
            'codigo_barra.string' => 'El código de barras debe ser texto.',
            'stock_actual.required' => 'El stock actual es obligatorio.',
            'stock_actual.integer' => 'El stock actual debe ser un número entero.',
            'stock_minimo.required' => 'El stock mínimo es obligatorio.',
            'stock_minimo.integer' => 'El stock mínimo debe ser un número entero.',
            'precio_compra.required' => 'El precio de compra es obligatorio.',
            'precio_compra.numeric' => 'El precio de compra debe ser un número.',
            'precio_venta.required' => 'El precio de venta es obligatorio.',
            'precio_venta.numeric' => 'El precio de venta debe ser un número.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.exists' => 'La categoría seleccionada no es válida.',
            'marca_nombre.required_without' => 'La marca es obligatoria.',
            'marca_nombre.string' => 'El nombre de la marca debe ser texto.',
            'marca_id.exists' => 'La marca seleccionada no es válida.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'codigo_barra' => 'código de barras',
            'stock_actual' => 'stock actual',
            'stock_minimo' => 'stock mínimo',
            'precio_compra' => 'precio de compra',
            'precio_venta' => 'precio de venta',
            'categoria_id' => 'categoría',
            'marca_nombre' => 'marca',
            'marca_id' => 'marca',
        ];
    }
}
