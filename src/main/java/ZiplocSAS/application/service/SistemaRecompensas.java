package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.NivelUsuario;
import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoBeneficio;
import ZiplocSAS.domain.enums.TipoTransaccion;
import ZiplocSAS.domain.model.Beneficio;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.domain.model.Usuario;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
/**
 * Servicio de fidelizacion responsable de puntos, niveles y beneficios.
 */

@Service
@RequiredArgsConstructor
public class SistemaRecompensas {
    private final PlataformaContext context;
    private final UsuarioService usuarioService;
    private final NotificacionService notificacionService;

    /**
     * Inicializa beneficios base disponibles para los distintos niveles.
     */
    @PostConstruct
    public void inicializarBeneficios() {
        if (!context.getBeneficios().isEmpty()) {
            return;
        }
        registrarBeneficio("5% de descuento en comisiones", NivelUsuario.BRONCE, 120, TipoBeneficio.DESCUENTO_COMISIONES);
        registrarBeneficio("Puntos dobles por un dia", NivelUsuario.PLATA, 300, TipoBeneficio.PUNTOS_DOBLES);
        registrarBeneficio("Reembolso en pago programado", NivelUsuario.ORO, 700, TipoBeneficio.REEMBOLSO);
        registrarBeneficio("Acceso premium de analitica", NivelUsuario.PLATINO, 1500, TipoBeneficio.ACCESO_CARACTERISTICAS);
    }

    public List<Beneficio> listarBeneficios() {
        return context.getBeneficios();
    }

    /**
     * Calcula puntos generados por una transaccion segun tipo y valor.
     *
     * @param tipo tipo de transaccion.
     * @param valor monto procesado.
     * @return puntos ganados.
     */
    public int calcularPuntos(TipoTransaccion tipo, double valor) {
        int bloques = (int) Math.floor(valor / 100.0);
        return switch (tipo) {
            case RECARGA -> bloques;
            case RETIRO -> bloques * 2;
            case TRANSFERENCIA -> bloques * 3;
            case PAGO_PROGRAMADO -> bloques * 3 + 10;
        };
    }

    public void aplicarPuntos(Transaccion transaccion, String usuarioId) {
        int puntos = calcularPuntos(transaccion.getTipo(), transaccion.getValor());
        transaccion.setPuntosGenerados(puntos);
        usuarioService.incrementarPuntos(usuarioId, puntos);
    }

    public boolean canjearBeneficio(String usuarioId, String beneficioId) {
        Usuario usuario = usuarioService.obtenerObligatorio(usuarioId);
        Beneficio beneficio = buscarBeneficio(beneficioId).orElse(null);
        if (beneficio == null || !beneficio.isActivo()) {
            return false;
        }
        if (!cumpleNivel(usuario.getNivel(), beneficio.getNivelRequerido())) {
            return false;
        }
        if (usuario.getPuntosAcumulados() < beneficio.getPuntosNecesarios()) {
            return false;
        }

        usuarioService.descontarPuntos(usuarioId, beneficio.getPuntosNecesarios());
        context.beneficiosCanjeados(usuarioId).add(beneficioId);
        notificacionService.crear(
                usuarioId,
                TipoAlerta.BENEFICIO_DISPONIBLE,
                "Beneficio canjeado: " + beneficio.getDescripcion()
        );
        return true;
    }

    Optional<Beneficio> buscarBeneficio(String beneficioId) {
        return context.getBeneficios()
                .stream()
                .filter(beneficio -> beneficio.getId().equals(beneficioId))
                .findFirst();
    }

    private void registrarBeneficio(String descripcion, NivelUsuario nivel, int puntos, TipoBeneficio tipo) {
        context.getBeneficios().add(Beneficio.builder()
                .id(UUID.randomUUID().toString())
                .descripcion(descripcion)
                .nivelRequerido(nivel)
                .puntosNecesarios(puntos)
                .tipo(tipo)
                .activo(true)
                .build());
    }

    private boolean cumpleNivel(NivelUsuario actual, NivelUsuario requerido) {
        return actual.ordinal() >= requerido.ordinal();
    }
}
