package ZiplocSAS.domain.enums;
/**
 * Tipos de eventos registrados en auditoria.
 */

public enum TipoEvento {
    LOGIN("User login"),
    LOGOUT("User logout"),
    TRANSACCION_INICIADA("Transaction started"),
    TRANSACCION_COMPLETADA("Transaction completed"),
    CAMBIO_NIVEL("User level changed"),
    BENEFICIO_CANJEADO("Benefit redeemed"),
    ALERTA_GENERADA("Alert generated"),
    ACCESO_DENEGADO("Access denied");

    private final String descripcion;

    TipoEvento(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
