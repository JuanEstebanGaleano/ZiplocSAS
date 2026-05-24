package ZiplocSAS.domain.enums;
/**
 * Categorias de alertas y notificaciones para los usuarios.
 */

public enum TipoAlerta {
    TRANSACCION_COMPLETADA("Transaction completed successfully"),
    TRANSACCION_FALLIDA("Transaction failed"),
    SALDO_BAJO("Low balance warning"),
    ACCESO_INUSUAL("Unusual access detected"),
    BENEFICIO_DISPONIBLE("Loyalty benefit available"),
    LIMITE_EXCEDIDO("Transaction limit exceeded");

    private final String descripcion;

    TipoAlerta(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
