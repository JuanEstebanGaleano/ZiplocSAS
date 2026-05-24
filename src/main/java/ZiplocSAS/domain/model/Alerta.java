package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.TipoAlerta;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
/**
 * Notificacion persistida para informar eventos relevantes a un usuario.
 */

@Document(collection = "alertas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alerta {
    @Id
    private String id;
    private String usuarioId;
    private TipoAlerta tipo;
    private String mensaje;
    private LocalDateTime fecha;
    private boolean leida;

    @Override
    public String toString() {
        return String.format("Alerta{id='%s', tipo=%s, mensaje='%s', fecha=%s, leida=%b}",
                id, tipo, mensaje, fecha, leida);
    }
}

