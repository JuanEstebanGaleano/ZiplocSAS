package ZiplocSAS.api.dto;

import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoEvento;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for EventoAuditoria requests/responses
 */
/**
 * DTO para exponer eventos de auditoria.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventoAuditoriaDTO {
    private String id;
    private String transaccionId;
    private String usuarioId;
    private TipoEvento tipoEvento;
    private NivelRiesgo nivelRiesgo;
    private String descripcion;
    private LocalDateTime fecha;
    private Boolean revisado;
}

