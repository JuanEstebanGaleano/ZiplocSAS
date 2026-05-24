package ZiplocSAS.application.service;

import ZiplocSAS.domain.model.Beneficio;
import ZiplocSAS.domain.model.EventoAuditoria;
import ZiplocSAS.domain.model.OperacionProgramada;
import ZiplocSAS.domain.structures.ArbolFidelizacion;
import ZiplocSAS.domain.structures.ColaNotificaciones;
import ZiplocSAS.domain.structures.ColaProgramadas;
import ZiplocSAS.domain.structures.GestorTransacciones;
import ZiplocSAS.domain.structures.GrafoTransferencias;
import ZiplocSAS.domain.structures.TablaBilleteras;
import ZiplocSAS.domain.structures.TablaUsuarios;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * Contenedor de estructuras de datos en memoria usadas por la plataforma.
 */

@Getter
@Component
public class PlataformaContext {
    private static final int MAX_NOTIFICACIONES_POR_USUARIO = 30;

    private final TablaUsuarios tablaUsuarios = new TablaUsuarios();
    private final TablaBilleteras tablaBilleteras = new TablaBilleteras();
    private final GestorTransacciones gestorTransacciones = new GestorTransacciones();
    private final ColaProgramadas colaProgramadas = new ColaProgramadas();
    private final GrafoTransferencias grafoTransferencias = new GrafoTransferencias();
    private final ArbolFidelizacion arbolFidelizacion = new ArbolFidelizacion();
    private final List<EventoAuditoria> eventosAuditoria = new ArrayList<>();
    private final List<Beneficio> beneficios = new ArrayList<>();
    private final List<OperacionProgramada> operacionesProcesadas = new ArrayList<>();
    private final Map<String, ColaNotificaciones> notificacionesPorUsuario = new HashMap<>();
    private final Map<String, List<String>> beneficiosCanjeadosPorUsuario = new HashMap<>();

    /**
     * Obtiene o crea la cola de notificaciones de un usuario.
     *
     * @param usuarioId identificador del usuario.
     * @return cola limitada de notificaciones.
     */
    public ColaNotificaciones colaNotificaciones(String usuarioId) {
        return notificacionesPorUsuario.computeIfAbsent(
                usuarioId,
                ignored -> new ColaNotificaciones(MAX_NOTIFICACIONES_POR_USUARIO)
        );
    }

    /**
     * Obtiene o crea el registro en memoria de beneficios canjeados.
     *
     * @param usuarioId identificador del usuario.
     * @return ids de beneficios canjeados.
     */
    public List<String> beneficiosCanjeados(String usuarioId) {
        return beneficiosCanjeadosPorUsuario.computeIfAbsent(usuarioId, ignored -> new ArrayList<>());
    }
}
