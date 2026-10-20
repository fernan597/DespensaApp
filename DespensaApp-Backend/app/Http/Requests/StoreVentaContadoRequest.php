<?php

namespace App\Http\Requests;

class StoreVentaContadoRequest extends BaseVentaRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'cliente_id' => 'nullable|exists:clientes,id',
            'medio_pago' => 'required|in:EFECTIVO,TRANSFERENCIA,DEBITO,CREDITO',
        ]);
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'cliente_id.exists'   => 'El cliente seleccionado no existe.',
            'medio_pago.required' => 'El medio de pago es obligatorio.',
            'medio_pago.in'       => 'El medio de pago debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO.',
        ]);
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), [
            'cliente_id' => 'cliente',
            'medio_pago' => 'medio de pago',
        ]);
    }
}
