<?php

namespace App\Models;

use App\Enums\AccionAuditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registro inmutable de acciones sensibles del sistema.
 */
class Auditoria extends Model
{
    protected $table = 'auditorias';

    protected $fillable = [
        'user_id',
        'accion',
        'detalle',
    ];

    /**
     * Fuerza la inmutabilidad: los registros no pueden modificarse ni eliminarse.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \LogicException('Los registros de auditoría son inmutables.');
        });

        static::deleting(function () {
            throw new \LogicException('Los registros de auditoría no pueden eliminarse.');
        });
    }

    protected function casts(): array
    {
        return [
            'accion' => AccionAuditoria::class,
        ];
    }

    /**
     * Usuario que ejecutó la acción. Se incluyen usuarios eliminados
     * lógicamente para no perder la trazabilidad histórica.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
