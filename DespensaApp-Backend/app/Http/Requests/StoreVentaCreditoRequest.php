<?php

namespace App\Http\Requests;

class StoreVentaCreditoRequest extends BaseVentaRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'cliente_id' => 'required|exists:clientes,id',
        ]);
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'cliente_id.required' => 'Debe seleccionar un cliente para registrar una venta a crédito.',
            'cliente_id.exists'   => 'El cliente seleccionado no existe en el sistema.',
        ]);
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), [
            'cliente_id' => 'cliente',
        ]);
    }
}
