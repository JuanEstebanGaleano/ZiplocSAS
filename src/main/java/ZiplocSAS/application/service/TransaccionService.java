package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.EstadoTransaccion;
import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoEvento;
import ZiplocSAS.domain.enums.TipoTransaccion;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.EventoAuditoria;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.infrastructure.repository.EventoAuditoriaRepository;
import ZiplocSAS.infrastructure.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
/**
 * Servicio de aplicacion para movimientos financieros entre billeteras.
 */

@Service
@RequiredArgsConstructor
public class TransaccionService {
    private static final double MONTO_ALTO_ABSOLUTO = 1_000_000.0;
    private static final double MONTO_CRITICO_ABSOLUTO = 5_000_000.0;

    private final PlataformaContext context;
    private final BilleteraService billeteraService;
    private final UsuarioService usuarioService;
    private final SistemaRecompensas sistemaRecompensas;
    private final NotificacionService notificacionService;
    private final TransaccionRepository transaccionRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;

    /**
     * Ejecuta una transaccion, actualiza saldos, calcula riesgo y otorga puntos.
     *
     * @param transaccion solicitud de movimiento financiero.
     * @return transaccion completada y persistida.
     */
    public synchronized Transaccion crear(Transaccion transaccion) {
        prepararTransaccion(transaccion);

        try {
            String usuarioPrincipal = ejecutarMovimiento(transaccion);
            transaccion.setNivelRiesgo(evaluarRiesgo(transaccion, usuarioPrincipal));
            transaccion.setEstado(EstadoTransaccion.COMPLETADA);

            sistemaRecompensas.aplicarPuntos(transaccion, usuarioPrincipal);
            Transaccion guardada = transaccionRepository.save(transaccion);
            sincronizarTransaccion(guardada);
            agregarHistorialBilleteras(guardada);
            registrarGrafo(guardada);
            notificacionService.crear(usuarioPrincipal, TipoAlerta.TRANSACCION_COMPLETADA, "Transaccion completada");

            if (esRiesgoAuditable(guardada.getNivelRiesgo())) {
                registrarAuditoria(
                        guardada,
                        usuarioPrincipal,
                        TipoEvento.ALERTA_GENERADA,
                        "Patron financiero inusual detectado"
                );
                notificacionService.crear(
                        usuarioPrincipal,
                        TipoAlerta.ACCESO_INUSUAL,
                        "Transaccion marcada con riesgo " + guardada.getNivelRiesgo().name()
                );
            }

            return guardada;
        } catch (RuntimeException ex) {
            notificarFalloSiEsPosible(transaccion);
            throw ex;
        }
    }

    public Optional<Transaccion> buscarPorId(String transaccionId) {
        Optional<Transaccion> transaccion = transaccionRepository.findById(transaccionId);
        transaccion.ifPresent(this::sincronizarTransaccion);
        return transaccion.or(() -> Optional.ofNullable(context.getGestorTransacciones().buscar(transaccionId)));
    }

    public List<Transaccion> listarPorBilletera(String billeteraId) {
        billeteraService.obtenerObligatoria(billeteraId);
        List<Transaccion> transacciones = transaccionRepository
                .findByBilleteraOrigenIdOrBilleteraDestinoId(billeteraId, billeteraId);
        if (transacciones.isEmpty()) {
            return context.getGestorTransacciones().obtenerPorBilletera(billeteraId);
        }
        transacciones.forEach(this::sincronizarTransaccion);
        transacciones.sort(Comparator.comparing(Transaccion::getFecha, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return transacciones;
    }

    public List<Transaccion> listarTodas() {
        List<Transaccion> transacciones = transaccionRepository.findAll();
        if (transacciones.isEmpty()) {
            return context.getGestorTransacciones().obtenerHistorial();
        }
        transacciones.forEach(this::sincronizarTransaccion);
        transacciones.sort(Comparator.comparing(Transaccion::getFecha, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return transacciones;
    }

    public List<Transaccion> filtrarPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        LocalDateTime desde = inicio == null ? LocalDateTime.MIN : inicio;
        LocalDateTime hasta = fin == null ? LocalDateTime.MAX : fin;
        return listarTodas().stream()
                .filter(transaccion -> transaccion.getFecha() != null)
                .filter(transaccion -> !transaccion.getFecha().isBefore(desde))
                .filter(transaccion -> !transaccion.getFecha().isAfter(hasta))
                .toList();
    }

    public List<Transaccion> mayoresValores(int limite) {
        return listarTodas().stream()
                .sorted(Comparator.comparingDouble(Transaccion::getValor).reversed())
                .limit(Math.max(0, limite))
                .toList();
    }

    /**
     * Revierte una transaccion completada cuando el movimiento inverso es posible.
     *
     * @param transaccionId identificador de la transaccion.
     * @return {@code true} si la reversion fue aplicada.
     */
    public synchronized boolean revertir(String transaccionId) {
        Transaccion transaccion = buscarPorId(transaccionId).orElse(null);
        if (transaccion == null || transaccion.getEstado() != EstadoTransaccion.COMPLETADA) {
            return false;
        }

        String usuarioPrincipal = resolverUsuarioPrincipal(transaccion);
        try {
            switch (transaccion.getTipo()) {
                case RECARGA -> revertirRecarga(transaccion);
                case RETIRO -> billeteraService.ajustarSaldo(transaccion.getBilleteraOrigenId(), transaccion.getValor());
                case TRANSFERENCIA, PAGO_PROGRAMADO -> revertirTransferencia(transaccion);
            }
        } catch (RuntimeException ex) {
            notificacionService.crear(
                    usuarioPrincipal,
                    TipoAlerta.TRANSACCION_FALLIDA,
                    "No fue posible revertir la transaccion " + transaccionId
            );
            return false;
        }

        transaccion.setEstado(EstadoTransaccion.REVERTIDA);
        Transaccion guardada = transaccionRepository.save(transaccion);
        sincronizarTransaccion(guardada);
        usuarioService.descontarPuntos(usuarioPrincipal, transaccion.getPuntosGenerados());
        registrarAuditoria(transaccion, usuarioPrincipal, TipoEvento.ALERTA_GENERADA, "Transaccion revertida");
        notificacionService.crear(usuarioPrincipal, TipoAlerta.TRANSACCION_COMPLETADA, "Transaccion revertida");
        return true;
    }

    public synchronized Optional<Transaccion> revertirUltima() {
        Transaccion transaccion = context.getGestorTransacciones().revertir();
        if (transaccion == null) {
            return Optional.empty();
        }
        return revertir(transaccion.getId()) ? Optional.of(transaccion) : Optional.empty();
    }

    long contarTransferenciasUsuario(String usuarioId) {
        return listarTodas().stream()
                .filter(t -> t.getEstado() == EstadoTransaccion.COMPLETADA)
                .filter(t -> t.getTipo() == TipoTransaccion.TRANSFERENCIA || t.getTipo() == TipoTransaccion.PAGO_PROGRAMADO)
                .filter(t -> usuarioId.equals(resolverUsuarioPrincipalSeguro(t)))
                .count();
    }

    private void prepararTransaccion(Transaccion transaccion) {
        if (transaccion == null) {
            throw new IllegalArgumentException("La transaccion es obligatoria");
        }
        if (transaccion.getTipo() == null) {
            throw new IllegalArgumentException("El tipo de transaccion es obligatorio");
        }
        if (transaccion.getValor() <= 0) {
            throw new IllegalArgumentException("El valor de la transaccion debe ser positivo");
        }
        transaccion.setId(UUID.randomUUID().toString());
        transaccion.setFecha(LocalDateTime.now());
        transaccion.setNivelRiesgo(NivelRiesgo.BAJO);
        transaccion.setPuntosGenerados(0);
    }

    private String ejecutarMovimiento(Transaccion transaccion) {
        return switch (transaccion.getTipo()) {
            case RECARGA -> ejecutarRecarga(transaccion);
            case RETIRO -> ejecutarRetiro(transaccion);
            case TRANSFERENCIA, PAGO_PROGRAMADO -> ejecutarTransferencia(transaccion);
        };
    }

    private String ejecutarRecarga(Transaccion transaccion) {
        String billeteraDestinoId = primeraNoVacia(transaccion.getBilleteraDestinoId(), transaccion.getBilleteraOrigenId());
        validarId(billeteraDestinoId, "La billetera destino es obligatoria para una recarga");
        billeteraService.validarOperable(billeteraDestinoId);
        billeteraService.ajustarSaldo(billeteraDestinoId, transaccion.getValor());
        transaccion.setBilleteraDestinoId(billeteraDestinoId);
        transaccion.setBilleteraOrigenId(null);
        return billeteraService.obtenerObligatoria(billeteraDestinoId).getUsuarioId();
    }

    private String ejecutarRetiro(Transaccion transaccion) {
        validarId(transaccion.getBilleteraOrigenId(), "La billetera origen es obligatoria para un retiro");
        billeteraService.validarOperable(transaccion.getBilleteraOrigenId());
        billeteraService.ajustarSaldo(transaccion.getBilleteraOrigenId(), -transaccion.getValor());
        return billeteraService.obtenerObligatoria(transaccion.getBilleteraOrigenId()).getUsuarioId();
    }

    private String ejecutarTransferencia(Transaccion transaccion) {
        validarId(transaccion.getBilleteraOrigenId(), "La billetera origen es obligatoria para transferir");
        validarId(transaccion.getBilleteraDestinoId(), "La billetera destino es obligatoria para transferir");
        if (transaccion.getBilleteraOrigenId().equals(transaccion.getBilleteraDestinoId())) {
            throw new IllegalArgumentException("La billetera origen y destino deben ser diferentes");
        }
        billeteraService.validarOperable(transaccion.getBilleteraOrigenId());
        billeteraService.validarOperable(transaccion.getBilleteraDestinoId());

        billeteraService.ajustarSaldo(transaccion.getBilleteraOrigenId(), -transaccion.getValor());
        billeteraService.ajustarSaldo(transaccion.getBilleteraDestinoId(), transaccion.getValor());
        return billeteraService.obtenerObligatoria(transaccion.getBilleteraOrigenId()).getUsuarioId();
    }

    private void revertirRecarga(Transaccion transaccion) {
        String billeteraDestinoId = primeraNoVacia(transaccion.getBilleteraDestinoId(), transaccion.getBilleteraOrigenId());
        billeteraService.ajustarSaldo(billeteraDestinoId, -transaccion.getValor());
    }

    private void revertirTransferencia(Transaccion transaccion) {
        billeteraService.ajustarSaldo(transaccion.getBilleteraDestinoId(), -transaccion.getValor());
        billeteraService.ajustarSaldo(transaccion.getBilleteraOrigenId(), transaccion.getValor());
    }

    private void agregarHistorialBilleteras(Transaccion transaccion) {
        if (transaccion.getBilleteraOrigenId() != null) {
            billeteraService.agregarHistorial(transaccion.getBilleteraOrigenId(), transaccion);
        }
        if (transaccion.getBilleteraDestinoId() != null) {
            billeteraService.agregarHistorial(transaccion.getBilleteraDestinoId(), transaccion);
        }
    }

    private void registrarGrafo(Transaccion transaccion) {
        if (transaccion.getBilleteraOrigenId() == null || transaccion.getBilleteraDestinoId() == null) {
            return;
        }
        Billetera origen = billeteraService.obtenerObligatoria(transaccion.getBilleteraOrigenId());
        Billetera destino = billeteraService.obtenerObligatoria(transaccion.getBilleteraDestinoId());
        context.getGrafoTransferencias().agregarArista(origen.getUsuarioId(), destino.getUsuarioId(), transaccion.getValor());
    }

    private NivelRiesgo evaluarRiesgo(Transaccion transaccion, String usuarioId) {
        if (transaccion.getValor() >= MONTO_CRITICO_ABSOLUTO) {
            return NivelRiesgo.CRITICO;
        }

        List<Transaccion> historialUsuario = listarTodas().stream()
                .filter(t -> usuarioId.equals(resolverUsuarioPrincipalSeguro(t)))
                .filter(t -> t.getEstado() == EstadoTransaccion.COMPLETADA)
                .toList();

        double promedio = historialUsuario.stream()
                .mapToDouble(Transaccion::getValor)
                .average()
                .orElse(0.0);
        long ultimosDosMinutos = historialUsuario.stream()
                .filter(t -> t.getFecha().isAfter(transaccion.getFecha().minusMinutes(2)))
                .count();
        long mismoDestinoReciente = historialUsuario.stream()
                .filter(t -> transaccion.getBilleteraDestinoId() != null)
                .filter(t -> transaccion.getBilleteraDestinoId().equals(t.getBilleteraDestinoId()))
                .filter(t -> t.getFecha().isAfter(transaccion.getFecha().minusMinutes(10)))
                .count();

        int score = 0;
        if (transaccion.getValor() >= MONTO_ALTO_ABSOLUTO) {
            score += 2;
        }
        if (promedio > 0 && transaccion.getValor() >= promedio * 3) {
            score += 2;
        }
        if (ultimosDosMinutos >= 4) {
            score += 2;
        }
        if (mismoDestinoReciente >= 3) {
            score += 1;
        }
        int hora = transaccion.getFecha().getHour();
        if (hora >= 0 && hora < 5) {
            score += 1;
        }

        if (score >= 5) {
            return NivelRiesgo.CRITICO;
        }
        if (score >= 3) {
            return NivelRiesgo.ALTO;
        }
        if (score >= 1) {
            return NivelRiesgo.MEDIO;
        }
        return NivelRiesgo.BAJO;
    }

    private void registrarAuditoria(Transaccion transaccion, String usuarioId, TipoEvento tipoEvento, String descripcion) {
        EventoAuditoria evento = EventoAuditoria.builder()
                .id(UUID.randomUUID().toString())
                .transaccionId(transaccion.getId())
                .usuarioId(usuarioId)
                .tipoEvento(tipoEvento)
                .nivelRiesgo(transaccion.getNivelRiesgo())
                .descripcion(descripcion)
                .fecha(LocalDateTime.now())
                .revisado(false)
                .build();
        context.getEventosAuditoria().add(evento);
        eventoAuditoriaRepository.save(evento);
    }

    private boolean esRiesgoAuditable(NivelRiesgo riesgo) {
        return riesgo == NivelRiesgo.ALTO || riesgo == NivelRiesgo.CRITICO;
    }

    private String resolverUsuarioPrincipal(Transaccion transaccion) {
        String billeteraId = primeraNoVacia(transaccion.getBilleteraOrigenId(), transaccion.getBilleteraDestinoId());
        return billeteraService.obtenerObligatoria(billeteraId).getUsuarioId();
    }

    private String resolverUsuarioPrincipalSeguro(Transaccion transaccion) {
        try {
            return resolverUsuarioPrincipal(transaccion);
        } catch (NoSuchElementException | IllegalArgumentException ex) {
            return null;
        }
    }

    private void notificarFalloSiEsPosible(Transaccion transaccion) {
        String usuarioId = resolverUsuarioPrincipalSeguro(transaccion);
        if (usuarioId != null) {
            notificacionService.crear(usuarioId, TipoAlerta.TRANSACCION_FALLIDA, "Operacion rechazada");
        }
    }

    private String primeraNoVacia(String primero, String segundo) {
        if (primero != null && !primero.isBlank()) {
            return primero;
        }
        return segundo;
    }

    private void validarId(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(mensaje);
        }
    }

    private void sincronizarTransaccion(Transaccion transaccion) {
        Transaccion existente = context.getGestorTransacciones().buscar(transaccion.getId());
        if (existente == null) {
            context.getGestorTransacciones().agregar(transaccion);
            return;
        }
        copiarTransaccion(existente, transaccion);
    }

    private void copiarTransaccion(Transaccion destino, Transaccion origen) {
        destino.setFecha(origen.getFecha());
        destino.setTipo(origen.getTipo());
        destino.setValor(origen.getValor());
        destino.setBilleteraOrigenId(origen.getBilleteraOrigenId());
        destino.setBilleteraDestinoId(origen.getBilleteraDestinoId());
        destino.setEstado(origen.getEstado());
        destino.setPuntosGenerados(origen.getPuntosGenerados());
        destino.setNivelRiesgo(origen.getNivelRiesgo());
    }
}
