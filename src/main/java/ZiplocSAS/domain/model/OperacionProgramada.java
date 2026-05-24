package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.TipoTransaccion;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
/**
 * Operacion financiera diferida que se procesa mediante una cola de prioridad.
 */

@Document(collection = "operaciones_programadas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperacionProgramada {
    @Id
    private String id;
    private LocalDateTime fechaEjecucion;
    private TipoTransaccion tipo;
    private double valor;
    private String billeteraOrigenId;
    private String billeteraDestinoId;
    private boolean ejecutada;
    private int prioridad;

    @Override
    public String toString() {
        return String.format("OperacionProgramada{id='%s', fechaEjecucion=%s, tipo=%s, valor=%.2f, ejecutada=%b}",
                id, fechaEjecucion, tipo, valor, ejecutada);
    }
}

