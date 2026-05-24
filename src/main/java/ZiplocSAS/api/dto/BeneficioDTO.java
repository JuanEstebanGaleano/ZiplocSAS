package ZiplocSAS.api.dto;

import ZiplocSAS.domain.enums.NivelUsuario;
import ZiplocSAS.domain.enums.TipoBeneficio;
import lombok.*;

/**
 * DTO for Beneficio requests/responses
 */
/**
 * DTO para beneficios disponibles o canjeados.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficioDTO {
    private String id;
    private String descripcion;
    private NivelUsuario nivelRequerido;
    private Integer puntosNecesarios;
    private TipoBeneficio tipo;
    private Boolean activo;
}

