package ZiplocSAS.domain.enums;
/**
 * Niveles de fidelizacion calculados a partir de puntos acumulados.
 */

public enum NivelUsuario {
    BRONCE("Bronce - Entrada"),
    PLATA("Plata - Intermedio"),
    ORO("Oro - Avanzado"),
    PLATINO("Platino - Premium");

    private final String descripcion;

    NivelUsuario(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
