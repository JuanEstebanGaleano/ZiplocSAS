package ZiplocSAS.infrastructure.repository;

import ZiplocSAS.domain.model.OperacionProgramada;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
/**
 * Repositorio MongoDB para operaciones programadas.
 */

public interface OperacionProgramadaRepository extends MongoRepository<OperacionProgramada, String> {
    /**
     * Lista operaciones pendientes en el orden de procesamiento.
     *
     * @return operaciones no ejecutadas ordenadas por fecha y prioridad.
     */
    List<OperacionProgramada> findByEjecutadaFalseOrderByFechaEjecucionAscPrioridadAsc();

    /**
     * Lista operaciones ya ejecutadas en orden historico.
     *
     * @return operaciones ejecutadas ordenadas por fecha y prioridad.
     */
    List<OperacionProgramada> findByEjecutadaTrueOrderByFechaEjecucionAscPrioridadAsc();
}
