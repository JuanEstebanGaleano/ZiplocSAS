package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.NivelUsuario;
import ZiplocSAS.domain.enums.TipoBeneficio;
import lombok.*;
/**
 * Beneficio canjeable del sistema de recompensas.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Beneficio {
    private String id;
    private String descripcion;
    private NivelUsuario nivelRequerido;
    private int puntosNecesarios;
    private TipoBeneficio tipo;
    private boolean activo;

    @Override
    public String toString() {
        return String.format("Beneficio{id='%s', descripcion='%s', nivelRequerido=%s, puntosNecesarios=%d, tipo=%s}",
                id, descripcion, nivelRequerido, puntosNecesarios, tipo);
    }
}

