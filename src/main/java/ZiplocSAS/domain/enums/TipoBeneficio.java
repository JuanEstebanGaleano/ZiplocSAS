package ZiplocSAS.domain.enums;
/**
 * Tipos de beneficios que puede ofrecer el sistema de recompensas.
 */

public enum TipoBeneficio {
    DESCUENTO_COMISIONES("Commission discount"),
    PUNTOS_DOBLES("Double loyalty points"),
    ACCESO_CARACTERISTICAS("Premium feature access"),
    REEMBOLSO("Cashback reward"),
    INTERES_MEJORADO("Improved interest rates");

    private final String descripcion;

    TipoBeneficio(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
