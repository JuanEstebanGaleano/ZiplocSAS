package ZiplocSAS.api.dto;

import ZiplocSAS.domain.enums.NivelUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
/**
 * Resumen plano de usuario activo para tablas analiticas.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioActivoDTO {
    private String id;
    private String nombre;
    private Long totalTransacciones;
    private Integer puntosAcumulados;
    private NivelUsuario nivel;
}
