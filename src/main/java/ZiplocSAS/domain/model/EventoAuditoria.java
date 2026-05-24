package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoEvento;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
/**
 * Evento de auditoria generado por accesos, transacciones o alertas de riesgo.
 */

@Document(collection = "eventos_auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventoAuditoria {
    @Id
    private String id;
    private String transaccionId;
    private String usuarioId;
    private TipoEvento tipoEvento;
    private NivelRiesgo nivelRiesgo;
    private String descripcion;
    private LocalDateTime fecha;
    private boolean revisado;

    @Override
    public String toString() {
        return String.format("EventoAuditoria{id='%s', tipoEvento=%s, usuarioId='%s', fecha=%s, nivelRiesgo=%s}",
                id, tipoEvento, usuarioId, fecha, nivelRiesgo);
    }
}

