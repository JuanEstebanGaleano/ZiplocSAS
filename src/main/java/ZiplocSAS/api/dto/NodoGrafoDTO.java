package ZiplocSAS.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
/**
 * Nodo visual del grafo de transferencias.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodoGrafoDTO {
    private String id;
    private String nombre;
}
