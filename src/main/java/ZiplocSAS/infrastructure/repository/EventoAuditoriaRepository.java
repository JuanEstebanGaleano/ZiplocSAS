package ZiplocSAS.infrastructure.repository;

import ZiplocSAS.domain.model.EventoAuditoria;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
/**
 * Repositorio MongoDB para eventos de auditoria.
 */

public interface EventoAuditoriaRepository extends MongoRepository<EventoAuditoria, String> {
    /**
     * Lista eventos de auditoria por usuario.
     *
     * @param usuarioId identificador del usuario.
     * @return eventos ordenados cronologicamente.
     */
    List<EventoAuditoria> findByUsuarioIdOrderByFechaAsc(String usuarioId);
}
