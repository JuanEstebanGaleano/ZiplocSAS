package ZiplocSAS.api.dto;

import ZiplocSAS.domain.enums.TipoAlerta;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Alerta requests/responses
 */
/**
 * DTO para transportar alertas y notificaciones.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaDTO {
    private String id;
    private String usuarioId;
    private TipoAlerta tipo;
    private String mensaje;
    private LocalDateTime fecha;
    private Boolean leida;
}

