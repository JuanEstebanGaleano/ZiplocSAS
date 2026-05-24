package ZiplocSAS.infrastructure.scheduler;

import ZiplocSAS.application.service.OperacionProgramadaService;
import ZiplocSAS.domain.model.OperacionProgramada;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
/**
 * Ejecuta periodicamente las operaciones programadas que ya vencieron.
 */

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "app.programadas.procesador.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class OperacionProgramadaScheduler {
    private static final Logger LOGGER = LoggerFactory.getLogger(OperacionProgramadaScheduler.class);

    private final OperacionProgramadaService operacionProgramadaService;

    @Scheduled(
            fixedDelayString = "${app.programadas.procesador.intervalo-ms:60000}",
            initialDelayString = "${app.programadas.procesador.retraso-inicial-ms:10000}"
    )
    /**
     * Procesa pagos y transferencias pendientes hasta la fecha actual.
     */
    public void procesarOperacionesVencidas() {
        List<OperacionProgramada> procesadas = operacionProgramadaService.procesarPendientes(LocalDateTime.now());
        if (!procesadas.isEmpty()) {
            LOGGER.info("Operaciones programadas procesadas automaticamente: {}", procesadas.size());
        }
    }
}
