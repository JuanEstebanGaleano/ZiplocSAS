package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.model.Alerta;
import ZiplocSAS.infrastructure.repository.AlertaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
/**
 * Servicio para crear, listar y despachar alertas de usuario.
 */

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private final PlataformaContext context;
    private final AlertaRepository alertaRepository;

    /**
     * Crea una alerta persistida y la encola para el usuario.
     *
     * @param usuarioId destinatario de la alerta.
     * @param tipo categoria de alerta.
     * @param mensaje texto visible para el usuario.
     * @return alerta creada.
     */
    public synchronized Alerta crear(String usuarioId, TipoAlerta tipo, String mensaje) {
        Alerta alerta = Alerta.builder()
                .id(UUID.randomUUID().toString())
                .usuarioId(usuarioId)
                .tipo(tipo)
                .mensaje(mensaje)
                .fecha(LocalDateTime.now())
                .leida(false)
                .build();
        Alerta guardada = alertaRepository.save(alerta);
        context.colaNotificaciones(usuarioId).encolar(guardada);
        return guardada;
    }

    public List<Alerta> listarPorUsuario(String usuarioId) {
        List<Alerta> alertas = new ArrayList<>(alertaRepository.findByUsuarioIdOrderByFechaAsc(usuarioId));
        if (alertas.isEmpty()) {
            return context.colaNotificaciones(usuarioId).historialReciente();
        }
        int inicio = Math.max(0, alertas.size() - context.colaNotificaciones(usuarioId).capacidadMaxima());
        return alertas.subList(inicio, alertas.size());
    }

    public Optional<Alerta> despachar(String usuarioId) {
        Alerta alerta = context.colaNotificaciones(usuarioId).despachar();
        if (alerta == null) {
            alerta = alertaRepository.findFirstByUsuarioIdOrderByFechaAsc(usuarioId).orElse(null);
        }
        if (alerta == null) {
            return Optional.empty();
        }
        alertaRepository.deleteById(alerta.getId());
        return Optional.of(alerta);
    }

    public boolean marcarLeida(String usuarioId, String alertaId) {
        Optional<Alerta> guardada = alertaRepository.findById(alertaId)
                .filter(alerta -> usuarioId.equals(alerta.getUsuarioId()));
        if (guardada.isPresent()) {
            Alerta alerta = guardada.get();
            alerta.setLeida(true);
            alertaRepository.save(alerta);
            marcarLeidaEnMemoria(usuarioId, alertaId);
            return true;
        }
        return marcarLeidaEnMemoria(usuarioId, alertaId);
    }

    private boolean marcarLeidaEnMemoria(String usuarioId, String alertaId) {
        for (Alerta alerta : context.colaNotificaciones(usuarioId).historialReciente()) {
            if (alerta.getId().equals(alertaId)) {
                alerta.setLeida(true);
                return true;
            }
        }
        return false;
    }
}
