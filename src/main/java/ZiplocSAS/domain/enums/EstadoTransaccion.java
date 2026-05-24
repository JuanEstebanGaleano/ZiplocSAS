package ZiplocSAS.domain.enums;
/**
 * Estados del ciclo de vida de una transaccion.
 */

public enum EstadoTransaccion {
    PENDIENTE("Awaiting processing"),
    COMPLETADA("Successfully completed"),
    FALLIDA("Failed to complete"),
    CANCELADA("User cancelled"),
    REVERTIDA("Successfully reversed");

    private final String descripcion;

    EstadoTransaccion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
