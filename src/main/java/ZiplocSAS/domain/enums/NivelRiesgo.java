package ZiplocSAS.domain.enums;
/**
 * Clasificacion de riesgo asignada a transacciones y eventos.
 */

public enum NivelRiesgo {
    BAJO("Low risk - normal operation"),
    MEDIO("Medium risk - monitor for patterns"),
    ALTO("High risk - requires review"),
    CRITICO("Critical - potential fraud");

    private final String descripcion;

    NivelRiesgo(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
