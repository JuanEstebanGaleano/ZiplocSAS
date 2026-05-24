package ZiplocSAS.domain.enums;
/**
 * Estados operativos posibles de una billetera.
 */

public enum EstadoBilletera {
    ACTIVA("Active and operational"),
    SUSPENDIDA("Temporarily suspended"),
    CONGELADA("Frozen - no operations allowed"),
    CERRADA("Permanently closed");

    private final String descripcion;

    EstadoBilletera(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
