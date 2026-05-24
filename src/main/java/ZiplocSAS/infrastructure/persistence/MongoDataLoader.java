package ZiplocSAS.infrastructure.persistence;

import ZiplocSAS.application.service.PlataformaContext;
import ZiplocSAS.domain.model.Alerta;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.EventoAuditoria;
import ZiplocSAS.domain.model.OperacionProgramada;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.domain.model.Usuario;
import ZiplocSAS.infrastructure.repository.AlertaRepository;
import ZiplocSAS.infrastructure.repository.BilleteraRepository;
import ZiplocSAS.infrastructure.repository.EventoAuditoriaRepository;
import ZiplocSAS.infrastructure.repository.OperacionProgramadaRepository;
import ZiplocSAS.infrastructure.repository.TransaccionRepository;
import ZiplocSAS.infrastructure.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
/**
 * Carga datos persistidos en MongoDB hacia las estructuras en memoria al iniciar.
 */

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.data-loader", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MongoDataLoader {
    private static final Logger LOGGER = LoggerFactory.getLogger(MongoDataLoader.class);

    private final PlataformaContext context;
    private final UsuarioRepository usuarioRepository;
    private final BilleteraRepository billeteraRepository;
    private final TransaccionRepository transaccionRepository;
    private final AlertaRepository alertaRepository;
    private final OperacionProgramadaRepository operacionProgramadaRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;

    @PostConstruct
    /**
     * Sincroniza las colecciones persistidas con tablas, colas, grafo y arbol.
     */
    public void cargarDatosPersistidos() {
        try {
            cargarUsuarios();
            cargarBilleteras();
            cargarTransacciones();
            cargarAlertas();
            cargarOperacionesProgramadas();
            cargarEventosAuditoria();
        } catch (RuntimeException ex) {
            LOGGER.warn("No fue posible cargar datos desde MongoDB al iniciar: {}", ex.getMessage());
        }
    }

    private void cargarUsuarios() {
        for (Usuario usuario : usuarioRepository.findAll()) {
            context.getTablaUsuarios().insertar(usuario);
            context.getArbolFidelizacion().insertar(usuario);
            context.getGrafoTransferencias().agregarVertice(usuario.getId());
        }
    }

    private void cargarBilleteras() {
        billeteraRepository.findAll().forEach(context.getTablaBilleteras()::insertar);
    }

    private void cargarTransacciones() {
        transaccionRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        Transaccion::getFecha,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ))
                .forEach(transaccion -> {
                    context.getGestorTransacciones().agregar(transaccion);
                    registrarTransferenciaEnGrafo(transaccion);
                });
    }

    private void cargarAlertas() {
        alertaRepository.findAll().stream()
                .filter(alerta -> alerta.getUsuarioId() != null)
                .sorted(Comparator.comparing(
                        Alerta::getFecha,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ))
                .forEach(alerta -> context.colaNotificaciones(alerta.getUsuarioId()).encolar(alerta));
    }

    private void cargarOperacionesProgramadas() {
        List<OperacionProgramada> pendientes = operacionProgramadaRepository
                .findByEjecutadaFalseOrderByFechaEjecucionAscPrioridadAsc();
        pendientes.forEach(context.getColaProgramadas()::encolar);

        context.getOperacionesProcesadas().addAll(operacionProgramadaRepository
                .findByEjecutadaTrueOrderByFechaEjecucionAscPrioridadAsc());
    }

    private void cargarEventosAuditoria() {
        eventoAuditoriaRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        EventoAuditoria::getFecha,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ))
                .forEach(context.getEventosAuditoria()::add);
    }

    private void registrarTransferenciaEnGrafo(Transaccion transaccion) {
        if (transaccion.getBilleteraOrigenId() == null || transaccion.getBilleteraDestinoId() == null) {
            return;
        }

        Billetera origen = context.getTablaBilleteras().buscarPorCodigo(transaccion.getBilleteraOrigenId());
        Billetera destino = context.getTablaBilleteras().buscarPorCodigo(transaccion.getBilleteraDestinoId());
        if (origen == null || destino == null) {
            return;
        }

        context.getGrafoTransferencias().agregarArista(
                origen.getUsuarioId(),
                destino.getUsuarioId(),
                transaccion.getValor()
        );
    }
}
