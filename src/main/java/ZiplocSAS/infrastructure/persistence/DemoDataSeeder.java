package ZiplocSAS.infrastructure.persistence;

import ZiplocSAS.application.service.PasswordService;
import ZiplocSAS.domain.enums.EstadoBilletera;
import ZiplocSAS.domain.enums.EstadoTransaccion;
import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.NivelUsuario;
import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoBilletera;
import ZiplocSAS.domain.enums.TipoEvento;
import ZiplocSAS.domain.enums.TipoTransaccion;
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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
/**
 * Seeder opt-in que limpia MongoDB y crea datos de demostracion coherentes.
 */

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed.demo", name = "enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {
    private static final Logger LOGGER = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_PASSWORD = "Demo2026!";

    private final UsuarioRepository usuarioRepository;
    private final BilleteraRepository billeteraRepository;
    private final TransaccionRepository transaccionRepository;
    private final AlertaRepository alertaRepository;
    private final OperacionProgramadaRepository operacionProgramadaRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;
    private final PasswordService passwordService;
    private final ConfigurableApplicationContext applicationContext;

    @Value("${app.seed.demo.exit-after:false}")
    private boolean exitAfterSeed;

    @Override
    /**
     * Ejecuta la limpieza y poblado de datos cuando la propiedad demo esta activa.
     *
     * @param args argumentos de arranque de Spring Boot.
     */
    public void run(ApplicationArguments args) {
        limpiarBaseDatos();

        LocalDateTime ahora = LocalDateTime.now().withNano(0);
        Map<String, Usuario> usuarios = crearUsuarios(ahora);
        Map<String, Billetera> billeteras = crearBilleteras();
        List<Transaccion> transacciones = crearTransacciones(ahora);

        agregarHistorialABilleteras(billeteras, transacciones);
        asignarBilleterasAUsuarios(usuarios, billeteras);

        usuarioRepository.saveAll(usuarios.values());
        billeteraRepository.saveAll(billeteras.values());
        transaccionRepository.saveAll(transacciones);
        alertaRepository.saveAll(crearAlertas(ahora));
        operacionProgramadaRepository.saveAll(crearOperacionesProgramadas(ahora));
        eventoAuditoriaRepository.saveAll(crearEventosAuditoria(ahora));

        LOGGER.info(
                "Demo seed listo: {} usuarios, {} billeteras, {} transacciones, {} alertas, {} programadas, {} eventos",
                usuarioRepository.count(),
                billeteraRepository.count(),
                transaccionRepository.count(),
                alertaRepository.count(),
                operacionProgramadaRepository.count(),
                eventoAuditoriaRepository.count()
        );

        if (exitAfterSeed) {
            SpringApplication.exit(applicationContext, () -> 0);
        }
    }

    private void limpiarBaseDatos() {
        alertaRepository.deleteAll();
        operacionProgramadaRepository.deleteAll();
        eventoAuditoriaRepository.deleteAll();
        transaccionRepository.deleteAll();
        billeteraRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    private Map<String, Usuario> crearUsuarios(LocalDateTime ahora) {
        Map<String, Usuario> usuarios = new LinkedHashMap<>();
        usuarios.put("usr-ana", usuario("usr-ana", "Ana Torres", "ana.torres@melowallet.test", "3001112233", NivelUsuario.PLATINO, 6840, ahora.minusDays(210)));
        usuarios.put("usr-carlos", usuario("usr-carlos", "Carlos Rios", "carlos.rios@melowallet.test", "3002223344", NivelUsuario.ORO, 2460, ahora.minusDays(170)));
        usuarios.put("usr-valeria", usuario("usr-valeria", "Valeria Gomez", "valeria.gomez@melowallet.test", "3003334455", NivelUsuario.ORO, 3890, ahora.minusDays(132)));
        usuarios.put("usr-mateo", usuario("usr-mateo", "Mateo Duarte", "mateo.duarte@melowallet.test", "3004445566", NivelUsuario.PLATA, 920, ahora.minusDays(96)));
        usuarios.put("usr-sofia", usuario("usr-sofia", "Sofia Marin", "sofia.marin@melowallet.test", "3005556677", NivelUsuario.PLATA, 720, ahora.minusDays(58)));
        usuarios.put("usr-nicolas", usuario("usr-nicolas", "Nicolas Pardo", "nicolas.pardo@melowallet.test", "3006667788", NivelUsuario.BRONCE, 280, ahora.minusDays(24)));
        return usuarios;
    }

    private Usuario usuario(String id, String nombre, String email, String telefono, NivelUsuario nivel, int puntos, LocalDateTime registro) {
        return Usuario.builder()
                .id(id)
                .nombre(nombre)
                .email(email)
                .passwordHash(passwordService.generarHash(DEMO_PASSWORD))
                .telefono(telefono)
                .nivel(nivel)
                .puntosAcumulados(puntos)
                .fechaRegistro(registro)
                .wallets(new ArrayList<>())
                .build();
    }

    private Map<String, Billetera> crearBilleteras() {
        Map<String, Billetera> billeteras = new LinkedHashMap<>();
        billeteras.put("wal-ana-principal", billetera("wal-ana-principal", "Principal Ana", TipoBilletera.CORRIENTE, 8_750_000, EstadoBilletera.ACTIVA, "usr-ana"));
        billeteras.put("wal-ana-ahorro", billetera("wal-ana-ahorro", "Ahorro viaje Ana", TipoBilletera.AHORROS, 3_280_000, EstadoBilletera.ACTIVA, "usr-ana"));
        billeteras.put("wal-carlos-nomina", billetera("wal-carlos-nomina", "Nomina Carlos", TipoBilletera.CORRIENTE, 2_430_000, EstadoBilletera.ACTIVA, "usr-carlos"));
        billeteras.put("wal-carlos-transporte", billetera("wal-carlos-transporte", "Transporte Carlos", TipoBilletera.TRANSPORTE, 18_500, EstadoBilletera.ACTIVA, "usr-carlos"));
        billeteras.put("wal-valeria-negocio", billetera("wal-valeria-negocio", "Negocio Valeria", TipoBilletera.INVERSION, 6_140_000, EstadoBilletera.ACTIVA, "usr-valeria"));
        billeteras.put("wal-valeria-impuestos", billetera("wal-valeria-impuestos", "Impuestos Valeria", TipoBilletera.AHORRO, 1_980_000, EstadoBilletera.ACTIVA, "usr-valeria"));
        billeteras.put("wal-mateo-campus", billetera("wal-mateo-campus", "Campus Mateo", TipoBilletera.GASTOS_DIARIOS, 640_000, EstadoBilletera.ACTIVA, "usr-mateo"));
        billeteras.put("wal-sofia-hogar", billetera("wal-sofia-hogar", "Hogar Sofia", TipoBilletera.COMPRAS, 1_120_000, EstadoBilletera.ACTIVA, "usr-sofia"));
        billeteras.put("wal-sofia-inversion", billetera("wal-sofia-inversion", "Inversion Sofia", TipoBilletera.INVERSION, 4_450_000, EstadoBilletera.ACTIVA, "usr-sofia"));
        billeteras.put("wal-nicolas-viajes", billetera("wal-nicolas-viajes", "Viajes Nicolas", TipoBilletera.AHORROS, 530_000, EstadoBilletera.ACTIVA, "usr-nicolas"));
        return billeteras;
    }

    private Billetera billetera(String id, String nombre, TipoBilletera tipo, double saldo, EstadoBilletera estado, String usuarioId) {
        return Billetera.builder()
                .id(id)
                .nombre(nombre)
                .tipo(tipo)
                .saldo(saldo)
                .estado(estado)
                .usuarioId(usuarioId)
                .historialTransacciones(new ArrayList<>())
                .build();
    }

    private List<Transaccion> crearTransacciones(LocalDateTime ahora) {
        return List.of(
                transaccion("tx-001", ahora.minusDays(45), TipoTransaccion.RECARGA, 1_800_000, null, "wal-ana-principal", EstadoTransaccion.COMPLETADA, 18_000, NivelRiesgo.BAJO),
                transaccion("tx-002", ahora.minusDays(43), TipoTransaccion.RECARGA, 1_200_000, null, "wal-carlos-nomina", EstadoTransaccion.COMPLETADA, 12_000, NivelRiesgo.BAJO),
                transaccion("tx-003", ahora.minusDays(40), TipoTransaccion.TRANSFERENCIA, 320_000, "wal-ana-principal", "wal-mateo-campus", EstadoTransaccion.COMPLETADA, 9_600, NivelRiesgo.BAJO),
                transaccion("tx-004", ahora.minusDays(38), TipoTransaccion.TRANSFERENCIA, 780_000, "wal-valeria-negocio", "wal-sofia-inversion", EstadoTransaccion.COMPLETADA, 23_400, NivelRiesgo.MEDIO),
                transaccion("tx-005", ahora.minusDays(35), TipoTransaccion.RETIRO, 220_000, "wal-carlos-nomina", null, EstadoTransaccion.COMPLETADA, 4_400, NivelRiesgo.BAJO),
                transaccion("tx-006", ahora.minusDays(32), TipoTransaccion.PAGO_PROGRAMADO, 460_000, "wal-sofia-hogar", "wal-valeria-impuestos", EstadoTransaccion.COMPLETADA, 13_810, NivelRiesgo.BAJO),
                transaccion("tx-007", ahora.minusDays(30), TipoTransaccion.TRANSFERENCIA, 150_000, "wal-mateo-campus", "wal-carlos-transporte", EstadoTransaccion.COMPLETADA, 4_500, NivelRiesgo.BAJO),
                transaccion("tx-008", ahora.minusDays(27), TipoTransaccion.TRANSFERENCIA, 1_250_000, "wal-ana-principal", "wal-valeria-negocio", EstadoTransaccion.COMPLETADA, 37_500, NivelRiesgo.ALTO),
                transaccion("tx-009", ahora.minusDays(24), TipoTransaccion.RECARGA, 900_000, null, "wal-nicolas-viajes", EstadoTransaccion.COMPLETADA, 9_000, NivelRiesgo.BAJO),
                transaccion("tx-010", ahora.minusDays(22), TipoTransaccion.TRANSFERENCIA, 95_000, "wal-nicolas-viajes", "wal-sofia-hogar", EstadoTransaccion.COMPLETADA, 2_850, NivelRiesgo.BAJO),
                transaccion("tx-011", ahora.minusDays(20), TipoTransaccion.PAGO_PROGRAMADO, 310_000, "wal-valeria-impuestos", "wal-carlos-nomina", EstadoTransaccion.COMPLETADA, 9_310, NivelRiesgo.BAJO),
                transaccion("tx-012", ahora.minusDays(18), TipoTransaccion.TRANSFERENCIA, 2_100_000, "wal-valeria-negocio", "wal-ana-ahorro", EstadoTransaccion.COMPLETADA, 63_000, NivelRiesgo.ALTO),
                transaccion("tx-013", ahora.minusDays(14), TipoTransaccion.RETIRO, 120_000, "wal-mateo-campus", null, EstadoTransaccion.REVERTIDA, 2_400, NivelRiesgo.BAJO),
                transaccion("tx-014", ahora.minusDays(12), TipoTransaccion.TRANSFERENCIA, 75_000, "wal-sofia-hogar", "wal-carlos-transporte", EstadoTransaccion.FALLIDA, 0, NivelRiesgo.BAJO),
                transaccion("tx-015", ahora.minusDays(9), TipoTransaccion.TRANSFERENCIA, 420_000, "wal-carlos-nomina", "wal-nicolas-viajes", EstadoTransaccion.COMPLETADA, 12_600, NivelRiesgo.BAJO),
                transaccion("tx-016", ahora.minusDays(7), TipoTransaccion.PAGO_PROGRAMADO, 680_000, "wal-ana-ahorro", "wal-sofia-inversion", EstadoTransaccion.COMPLETADA, 20_410, NivelRiesgo.MEDIO),
                transaccion("tx-017", ahora.minusDays(4), TipoTransaccion.TRANSFERENCIA, 1_450_000, "wal-valeria-negocio", "wal-sofia-inversion", EstadoTransaccion.COMPLETADA, 43_500, NivelRiesgo.ALTO),
                transaccion("tx-018", ahora.minusDays(2), TipoTransaccion.TRANSFERENCIA, 5_200_000, "wal-ana-principal", "wal-nicolas-viajes", EstadoTransaccion.COMPLETADA, 156_000, NivelRiesgo.CRITICO)
        );
    }

    private Transaccion transaccion(String id, LocalDateTime fecha, TipoTransaccion tipo, double valor, String origen, String destino,
                                    EstadoTransaccion estado, int puntos, NivelRiesgo riesgo) {
        return Transaccion.builder()
                .id(id)
                .fecha(fecha)
                .tipo(tipo)
                .valor(valor)
                .billeteraOrigenId(origen)
                .billeteraDestinoId(destino)
                .estado(estado)
                .puntosGenerados(puntos)
                .nivelRiesgo(riesgo)
                .build();
    }

    private void agregarHistorialABilleteras(Map<String, Billetera> billeteras, List<Transaccion> transacciones) {
        for (Transaccion transaccion : transacciones) {
            if (transaccion.getBilleteraOrigenId() != null) {
                billeteras.get(transaccion.getBilleteraOrigenId()).getHistorialTransacciones().add(transaccion);
            }
            if (transaccion.getBilleteraDestinoId() != null) {
                billeteras.get(transaccion.getBilleteraDestinoId()).getHistorialTransacciones().add(transaccion);
            }
        }
    }

    private void asignarBilleterasAUsuarios(Map<String, Usuario> usuarios, Map<String, Billetera> billeteras) {
        for (Billetera billetera : billeteras.values()) {
            usuarios.get(billetera.getUsuarioId()).getWallets().add(billetera);
        }
    }

    private List<Alerta> crearAlertas(LocalDateTime ahora) {
        return List.of(
                alerta("alt-001", "usr-ana", TipoAlerta.BENEFICIO_DISPONIBLE, "Tienes analitica premium disponible por tu nivel PLATINO", ahora.minusDays(8), false),
                alerta("alt-002", "usr-ana", TipoAlerta.ACCESO_INUSUAL, "Transferencia critica enviada a Viajes Nicolas", ahora.minusDays(2), false),
                alerta("alt-003", "usr-carlos", TipoAlerta.SALDO_BAJO, "Saldo bajo en billetera Transporte Carlos", ahora.minusDays(1), false),
                alerta("alt-004", "usr-carlos", TipoAlerta.TRANSACCION_COMPLETADA, "Transferencia recibida desde Valeria", ahora.minusDays(20), true),
                alerta("alt-005", "usr-valeria", TipoAlerta.ACCESO_INUSUAL, "Movimiento alto detectado en Negocio Valeria", ahora.minusDays(4), false),
                alerta("alt-006", "usr-mateo", TipoAlerta.TRANSACCION_COMPLETADA, "Recibiste apoyo para gastos de campus", ahora.minusDays(40), true),
                alerta("alt-007", "usr-sofia", TipoAlerta.TRANSACCION_FALLIDA, "Transferencia de Hogar Sofia rechazada por validacion", ahora.minusDays(12), false),
                alerta("alt-008", "usr-sofia", TipoAlerta.BENEFICIO_DISPONIBLE, "Puedes activar puntos dobles por un dia", ahora.minusDays(6), false),
                alerta("alt-009", "usr-nicolas", TipoAlerta.TRANSACCION_COMPLETADA, "Recarga y transferencias listas para tu viaje", ahora.minusDays(2), true),
                alerta("alt-010", "usr-valeria", TipoAlerta.LIMITE_EXCEDIDO, "Transferencia cercana al limite operativo diario", ahora.minusDays(4), false)
        );
    }

    private Alerta alerta(String id, String usuarioId, TipoAlerta tipo, String mensaje, LocalDateTime fecha, boolean leida) {
        return Alerta.builder()
                .id(id)
                .usuarioId(usuarioId)
                .tipo(tipo)
                .mensaje(mensaje)
                .fecha(fecha)
                .leida(leida)
                .build();
    }

    private List<OperacionProgramada> crearOperacionesProgramadas(LocalDateTime ahora) {
        return List.of(
                operacion("op-001", ahora.plusDays(1).withHour(9), TipoTransaccion.PAGO_PROGRAMADO, 185_000, "wal-carlos-nomina", "wal-carlos-transporte", false, 1),
                operacion("op-002", ahora.plusDays(3).withHour(7), TipoTransaccion.PAGO_PROGRAMADO, 520_000, "wal-sofia-hogar", "wal-valeria-impuestos", false, 2),
                operacion("op-003", ahora.plusDays(5).withHour(18), TipoTransaccion.TRANSFERENCIA, 250_000, "wal-ana-ahorro", "wal-mateo-campus", false, 3),
                operacion("op-004", ahora.minusDays(6), TipoTransaccion.PAGO_PROGRAMADO, 680_000, "wal-ana-ahorro", "wal-sofia-inversion", true, 1)
        );
    }

    private OperacionProgramada operacion(String id, LocalDateTime fecha, TipoTransaccion tipo, double valor, String origen, String destino,
                                          boolean ejecutada, int prioridad) {
        return OperacionProgramada.builder()
                .id(id)
                .fechaEjecucion(fecha)
                .tipo(tipo)
                .valor(valor)
                .billeteraOrigenId(origen)
                .billeteraDestinoId(destino)
                .ejecutada(ejecutada)
                .prioridad(prioridad)
                .build();
    }

    private List<EventoAuditoria> crearEventosAuditoria(LocalDateTime ahora) {
        return List.of(
                evento("aud-001", null, "usr-ana", TipoEvento.LOGIN, NivelRiesgo.BAJO, "Login exitoso desde navegador principal", ahora.minusDays(10), true),
                evento("aud-002", "tx-008", "usr-ana", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Transferencia alta hacia Negocio Valeria", ahora.minusDays(27), true),
                evento("aud-003", "tx-012", "usr-valeria", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Salida alta desde Negocio Valeria", ahora.minusDays(18), false),
                evento("aud-004", "tx-014", "usr-sofia", TipoEvento.ACCESO_DENEGADO, NivelRiesgo.MEDIO, "Operacion rechazada por regla de validacion", ahora.minusDays(12), false),
                evento("aud-005", null, "usr-carlos", TipoEvento.CAMBIO_NIVEL, NivelRiesgo.BAJO, "Usuario promovido a nivel ORO", ahora.minusDays(11), true),
                evento("aud-006", "tx-017", "usr-valeria", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Patron financiero inusual detectado", ahora.minusDays(4), false),
                evento("aud-007", "tx-018", "usr-ana", TipoEvento.ALERTA_GENERADA, NivelRiesgo.CRITICO, "Transferencia critica requiere revision manual", ahora.minusDays(2), false),
                evento("aud-008", null, "usr-nicolas", TipoEvento.LOGIN, NivelRiesgo.BAJO, "Login exitoso antes de confirmar viaje", ahora.minusDays(1), true)
        );
    }

    private EventoAuditoria evento(String id, String transaccionId, String usuarioId, TipoEvento tipo, NivelRiesgo riesgo,
                                   String descripcion, LocalDateTime fecha, boolean revisado) {
        return EventoAuditoria.builder()
                .id(id)
                .transaccionId(transaccionId)
                .usuarioId(usuarioId)
                .tipoEvento(tipo)
                .nivelRiesgo(riesgo)
                .descripcion(descripcion)
                .fecha(fecha)
                .revisado(revisado)
                .build();
    }
}
