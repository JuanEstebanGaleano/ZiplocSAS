package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoTransaccion;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.OperacionProgramada;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.infrastructure.repository.OperacionProgramadaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
/**
 * Servicio para administrar la cola de operaciones programadas.
 */

@Service
@RequiredArgsConstructor
public class OperacionProgramadaService {
    private final PlataformaContext context;
    private final TransaccionService transaccionService;
    private final BilleteraService billeteraService;
    private final NotificacionService notificacionService;
    private final OperacionProgramadaRepository operacionProgramadaRepository;

    /**
     * Agenda una operacion y la encola por fecha de ejecucion y prioridad.
     *
     * @param operacion datos de la operacion a programar.
     * @return operacion persistida.
     */
    public synchronized OperacionProgramada programar(OperacionProgramada operacion) {
        if (operacion == null) {
            throw new IllegalArgumentException("La operacion programada es obligatoria");
        }
        if (operacion.getValor() <= 0) {
            throw new IllegalArgumentException("El valor programado debe ser positivo");
        }
        if (operacion.getFechaEjecucion() == null) {
            operacion.setFechaEjecucion(LocalDateTime.now());
        }
        if (operacion.getTipo() == null) {
            operacion.setTipo(TipoTransaccion.PAGO_PROGRAMADO);
        }
        operacion.setId(UUID.randomUUID().toString());
        operacion.setEjecutada(false);

        OperacionProgramada guardada = operacionProgramadaRepository.save(operacion);
        context.getColaProgramadas().encolar(guardada);
        notificarProgramacion(guardada);
        return guardada;
    }

    public List<OperacionProgramada> listarPendientes() {
        List<OperacionProgramada> pendientes = operacionProgramadaRepository
                .findByEjecutadaFalseOrderByFechaEjecucionAscPrioridadAsc();
        return pendientes.isEmpty() ? context.getColaProgramadas().obtenerTodas() : pendientes;
    }

    public List<OperacionProgramada> listarProcesadas() {
        List<OperacionProgramada> procesadas = operacionProgramadaRepository
                .findByEjecutadaTrueOrderByFechaEjecucionAscPrioridadAsc();
        return procesadas.isEmpty() ? context.getOperacionesProcesadas() : procesadas;
    }

    /**
     * Procesa operaciones cuya fecha de ejecucion es menor o igual al corte.
     *
     * @param fechaCorte fecha maxima para ejecutar operaciones pendientes.
     * @return operaciones evaluadas durante el procesamiento.
     */
    public synchronized List<OperacionProgramada> procesarPendientes(LocalDateTime fechaCorte) {
        LocalDateTime corte = fechaCorte == null ? LocalDateTime.now() : fechaCorte;
        List<OperacionProgramada> procesadas = new ArrayList<>();

        while (!context.getColaProgramadas().estaVacia()) {
            OperacionProgramada siguiente = context.getColaProgramadas().peek();
            if (siguiente.getFechaEjecucion().isAfter(corte)) {
                break;
            }

            OperacionProgramada operacion = context.getColaProgramadas().procesarSiguiente();
            try {
                transaccionService.crear(Transaccion.builder()
                        .tipo(operacion.getTipo())
                        .valor(operacion.getValor())
                        .billeteraOrigenId(operacion.getBilleteraOrigenId())
                        .billeteraDestinoId(operacion.getBilleteraDestinoId())
                        .build());
                operacion.setEjecutada(true);
            } catch (RuntimeException ex) {
                operacion.setEjecutada(false);
                notificarFallo(operacion);
            }
            operacionProgramadaRepository.save(operacion);
            context.getOperacionesProcesadas().add(operacion);
            procesadas.add(operacion);
        }

        return procesadas;
    }

    private void notificarProgramacion(OperacionProgramada operacion) {
        String usuarioId = usuarioOperacion(operacion);
        if (usuarioId != null) {
            notificacionService.crear(
                    usuarioId,
                    TipoAlerta.TRANSACCION_COMPLETADA,
                    "Operacion programada para " + operacion.getFechaEjecucion()
            );
        }
    }

    private void notificarFallo(OperacionProgramada operacion) {
        String usuarioId = usuarioOperacion(operacion);
        if (usuarioId != null) {
            notificacionService.crear(usuarioId, TipoAlerta.TRANSACCION_FALLIDA, "Operacion programada rechazada");
        }
    }

    private String usuarioOperacion(OperacionProgramada operacion) {
        String billeteraId = operacion.getBilleteraOrigenId() != null
                ? operacion.getBilleteraOrigenId()
                : operacion.getBilleteraDestinoId();
        if (billeteraId == null) {
            return null;
        }
        try {
            Billetera billetera = billeteraService.obtenerObligatoria(billeteraId);
            return billetera.getUsuarioId();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
