package ZiplocSAS.infrastructure.repository;

import ZiplocSAS.domain.model.Alerta;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
/**
 * Repositorio MongoDB para alertas de usuario.
 */

public interface AlertaRepository extends MongoRepository<Alerta, String> {
    /**
     * Lista alertas de un usuario en orden cronologico.
     *
     * @param usuarioId identificador del usuario.
     * @return alertas ordenadas por fecha ascendente.
     */
    List<Alerta> findByUsuarioIdOrderByFechaAsc(String usuarioId);

    /**
     * Obtiene la alerta pendiente mas antigua de un usuario.
     *
     * @param usuarioId identificador del usuario.
     * @return primera alerta encontrada, si existe.
     */
    Optional<Alerta> findFirstByUsuarioIdOrderByFechaAsc(String usuarioId);
}
