<?php

namespace App\Http\Requests;

use App\Enums\AccionAuditoria;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAuditoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasRole(['admin', 'admin_despensa']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search'      => ['nullable', 'string', 'max:255'],
            'user_id'     => ['nullable', 'integer', 'exists:users,id'],
            'accion'      => ['nullable', Rule::enum(AccionAuditoria::class)],
            'fecha_desde' => ['nullable', 'date_format:Y-m-d'],
            'fecha_hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:fecha_desde'],
            'per_page'    => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'        => ['nullable', 'integer', 'min:1'],
        ];
    }
}
