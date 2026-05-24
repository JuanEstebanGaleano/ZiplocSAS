package ZiplocSAS.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
/**
 * Enlace dirigido entre dos nodos del grafo de transferencias.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnlaceGrafoDTO {
    private String origen;
    private String destino;
    private Double monto;
}
