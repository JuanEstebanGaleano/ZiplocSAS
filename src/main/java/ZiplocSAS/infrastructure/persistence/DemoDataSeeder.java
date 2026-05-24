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
        usuarios.put("usr-laura", usuario("usr-laura", "Laura Mendoza", "laura.mendoza@novawallet.test", "3114567821", NivelUsuario.PLATINO, 7420, ahora.minusDays(240)));
        usuarios.put("usr-andres", usuario("usr-andres", "Andres Velasco", "andres.velasco@novawallet.test", "3125678932", NivelUsuario.ORO, 2980, ahora.minusDays(180)));
        usuarios.put("usr-camila", usuario("usr-camila", "Camila Herrera", "camila.herrera@novawallet.test", "3136789043", NivelUsuario.ORO, 4150, ahora.minusDays(145)));
        usuarios.put("usr-julian", usuario("usr-julian", "Julian Castro", "julian.castro@novawallet.test", "3147890154", NivelUsuario.PLATA, 1100, ahora.minusDays(100)));
        usuarios.put("usr-paula", usuario("usr-paula", "Paula Ramirez", "paula.ramirez@novawallet.test", "3158901265", NivelUsuario.PLATA, 860, ahora.minusDays(65)));
        usuarios.put("usr-diego", usuario("usr-diego", "Diego Salazar", "diego.salazar@novawallet.test", "3169012376", NivelUsuario.BRONCE, 340, ahora.minusDays(35)));
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

        billeteras.put("wal-laura-main", billetera("wal-laura-main", "Principal Laura", TipoBilletera.CORRIENTE, 9_450_000, EstadoBilletera.ACTIVA, "usr-laura"));
        billeteras.put("wal-laura-save", billetera("wal-laura-save", "Reserva Laura", TipoBilletera.AHORROS, 4_120_000, EstadoBilletera.ACTIVA, "usr-laura"));

        billeteras.put("wal-andres-pay", billetera("wal-andres-pay", "Nomina Andres", TipoBilletera.CORRIENTE, 2_980_000, EstadoBilletera.ACTIVA, "usr-andres"));
        billeteras.put("wal-andres-move", billetera("wal-andres-move", "Movilidad Andres", TipoBilletera.TRANSPORTE, 32_000, EstadoBilletera.ACTIVA, "usr-andres"));

        billeteras.put("wal-camila-business", billetera("wal-camila-business", "Empresa Camila", TipoBilletera.INVERSION, 7_320_000, EstadoBilletera.ACTIVA, "usr-camila"));
        billeteras.put("wal-camila-tax", billetera("wal-camila-tax", "Tributos Camila", TipoBilletera.AHORRO, 2_210_000, EstadoBilletera.ACTIVA, "usr-camila"));

        billeteras.put("wal-julian-campus", billetera("wal-julian-campus", "Campus Julian", TipoBilletera.GASTOS_DIARIOS, 710_000, EstadoBilletera.ACTIVA, "usr-julian"));

        billeteras.put("wal-paula-home", billetera("wal-paula-home", "Hogar Paula", TipoBilletera.COMPRAS, 1_340_000, EstadoBilletera.ACTIVA, "usr-paula"));
        billeteras.put("wal-paula-invest", billetera("wal-paula-invest", "Inversion Paula", TipoBilletera.INVERSION, 5_180_000, EstadoBilletera.ACTIVA, "usr-paula"));

        billeteras.put("wal-diego-trip", billetera("wal-diego-trip", "Aventuras Diego", TipoBilletera.AHORROS, 690_000, EstadoBilletera.ACTIVA, "usr-diego"));

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
                transaccion("tx-101", ahora.minusDays(48), TipoTransaccion.RECARGA, 2_100_000, null, "wal-laura-main", EstadoTransaccion.COMPLETADA, 21_000, NivelRiesgo.BAJO),
                transaccion("tx-102", ahora.minusDays(45), TipoTransaccion.RECARGA, 1_450_000, null, "wal-andres-pay", EstadoTransaccion.COMPLETADA, 14_500, NivelRiesgo.BAJO),
                transaccion("tx-103", ahora.minusDays(41), TipoTransaccion.TRANSFERENCIA, 410_000, "wal-laura-main", "wal-julian-campus", EstadoTransaccion.COMPLETADA, 12_300, NivelRiesgo.BAJO),
                transaccion("tx-104", ahora.minusDays(39), TipoTransaccion.TRANSFERENCIA, 920_000, "wal-camila-business", "wal-paula-invest", EstadoTransaccion.COMPLETADA, 27_600, NivelRiesgo.MEDIO),
                transaccion("tx-105", ahora.minusDays(34), TipoTransaccion.RETIRO, 260_000, "wal-andres-pay", null, EstadoTransaccion.COMPLETADA, 5_200, NivelRiesgo.BAJO),
                transaccion("tx-106", ahora.minusDays(31), TipoTransaccion.PAGO_PROGRAMADO, 530_000, "wal-paula-home", "wal-camila-tax", EstadoTransaccion.COMPLETADA, 15_900, NivelRiesgo.BAJO),
                transaccion("tx-107", ahora.minusDays(29), TipoTransaccion.TRANSFERENCIA, 180_000, "wal-julian-campus", "wal-andres-move", EstadoTransaccion.COMPLETADA, 5_400, NivelRiesgo.BAJO),
                transaccion("tx-108", ahora.minusDays(26), TipoTransaccion.TRANSFERENCIA, 1_480_000, "wal-laura-main", "wal-camila-business", EstadoTransaccion.COMPLETADA, 44_400, NivelRiesgo.ALTO),
                transaccion("tx-109", ahora.minusDays(23), TipoTransaccion.RECARGA, 1_050_000, null, "wal-diego-trip", EstadoTransaccion.COMPLETADA, 10_500, NivelRiesgo.BAJO),
                transaccion("tx-110", ahora.minusDays(20), TipoTransaccion.TRANSFERENCIA, 125_000, "wal-diego-trip", "wal-paula-home", EstadoTransaccion.COMPLETADA, 3_750, NivelRiesgo.BAJO),
                transaccion("tx-111", ahora.minusDays(18), TipoTransaccion.PAGO_PROGRAMADO, 360_000, "wal-camila-tax", "wal-andres-pay", EstadoTransaccion.COMPLETADA, 10_800, NivelRiesgo.BAJO),
                transaccion("tx-112", ahora.minusDays(16), TipoTransaccion.TRANSFERENCIA, 2_450_000, "wal-camila-business", "wal-laura-save", EstadoTransaccion.COMPLETADA, 73_500, NivelRiesgo.ALTO),
                transaccion("tx-113", ahora.minusDays(13), TipoTransaccion.RETIRO, 150_000, "wal-julian-campus", null, EstadoTransaccion.REVERTIDA, 3_000, NivelRiesgo.BAJO),
                transaccion("tx-114", ahora.minusDays(10), TipoTransaccion.TRANSFERENCIA, 88_000, "wal-paula-home", "wal-andres-move", EstadoTransaccion.FALLIDA, 0, NivelRiesgo.BAJO),
                transaccion("tx-115", ahora.minusDays(8), TipoTransaccion.TRANSFERENCIA, 510_000, "wal-andres-pay", "wal-diego-trip", EstadoTransaccion.COMPLETADA, 15_300, NivelRiesgo.BAJO),
                transaccion("tx-116", ahora.minusDays(6), TipoTransaccion.PAGO_PROGRAMADO, 740_000, "wal-laura-save", "wal-paula-invest", EstadoTransaccion.COMPLETADA, 22_200, NivelRiesgo.MEDIO),
                transaccion("tx-117", ahora.minusDays(3), TipoTransaccion.TRANSFERENCIA, 1_780_000, "wal-camila-business", "wal-paula-invest", EstadoTransaccion.COMPLETADA, 53_400, NivelRiesgo.ALTO),
                transaccion("tx-118", ahora.minusDays(1), TipoTransaccion.TRANSFERENCIA, 5_850_000, "wal-laura-main", "wal-diego-trip", EstadoTransaccion.COMPLETADA, 175_500, NivelRiesgo.CRITICO)
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
                alerta("alt-101", "usr-laura", TipoAlerta.BENEFICIO_DISPONIBLE, "Acceso premium habilitado por tu nivel PLATINO", ahora.minusDays(9), false),
                alerta("alt-102", "usr-laura", TipoAlerta.ACCESO_INUSUAL, "Transferencia critica enviada a Aventuras Diego", ahora.minusDays(1), false),
                alerta("alt-103", "usr-andres", TipoAlerta.SALDO_BAJO, "Saldo reducido en billetera Movilidad Andres", ahora.minusDays(2), false),
                alerta("alt-104", "usr-andres", TipoAlerta.TRANSACCION_COMPLETADA, "Transferencia recibida desde Camila", ahora.minusDays(18), true),
                alerta("alt-105", "usr-camila", TipoAlerta.ACCESO_INUSUAL, "Movimiento financiero elevado detectado en Empresa Camila", ahora.minusDays(5), false),
                alerta("alt-106", "usr-julian", TipoAlerta.TRANSACCION_COMPLETADA, "Recibiste apoyo economico para gastos universitarios", ahora.minusDays(38), true),
                alerta("alt-107", "usr-paula", TipoAlerta.TRANSACCION_FALLIDA, "Transferencia desde Hogar Paula rechazada por validacion", ahora.minusDays(11), false),
                alerta("alt-108", "usr-paula", TipoAlerta.BENEFICIO_DISPONIBLE, "Tienes disponible una promocion de puntos dobles", ahora.minusDays(7), false),
                alerta("alt-109", "usr-diego", TipoAlerta.TRANSACCION_COMPLETADA, "Tus movimientos y recargas fueron procesados correctamente", ahora.minusDays(3), true),
                alerta("alt-110", "usr-camila", TipoAlerta.LIMITE_EXCEDIDO, "Operacion cercana al limite diario permitido", ahora.minusDays(4), false)
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
                operacion("op-101", ahora.plusDays(1).withHour(10), TipoTransaccion.PAGO_PROGRAMADO, 210_000, "wal-andres-pay", "wal-andres-move", false, 1),
                operacion("op-102", ahora.plusDays(4).withHour(8), TipoTransaccion.PAGO_PROGRAMADO, 610_000, "wal-paula-home", "wal-camila-tax", false, 2),
                operacion("op-103", ahora.plusDays(6).withHour(19), TipoTransaccion.TRANSFERENCIA, 340_000, "wal-laura-save", "wal-julian-campus", false, 3),
                operacion("op-104", ahora.minusDays(5), TipoTransaccion.PAGO_PROGRAMADO, 740_000, "wal-laura-save", "wal-paula-invest", true, 1)
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
                evento("aud-101", null, "usr-laura", TipoEvento.LOGIN, NivelRiesgo.BAJO, "Inicio de sesion exitoso desde dispositivo principal", ahora.minusDays(11), true),
                evento("aud-102", "tx-108", "usr-laura", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Transferencia elevada hacia Empresa Camila", ahora.minusDays(26), true),
                evento("aud-103", "tx-112", "usr-camila", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Movimiento de salida considerable detectado", ahora.minusDays(16), false),
                evento("aud-104", "tx-114", "usr-paula", TipoEvento.ACCESO_DENEGADO, NivelRiesgo.MEDIO, "Operacion bloqueada por regla automatica de seguridad", ahora.minusDays(10), false),
                evento("aud-105", null, "usr-andres", TipoEvento.CAMBIO_NIVEL, NivelRiesgo.BAJO, "Usuario ascendido al nivel ORO", ahora.minusDays(9), true),
                evento("aud-106", "tx-117", "usr-camila", TipoEvento.ALERTA_GENERADA, NivelRiesgo.ALTO, "Patron financiero atipico identificado", ahora.minusDays(3), false),
                evento("aud-107", "tx-118", "usr-laura", TipoEvento.ALERTA_GENERADA, NivelRiesgo.CRITICO, "Transferencia critica enviada para revision manual", ahora.minusDays(1), false),
                evento("aud-108", null, "usr-diego", TipoEvento.LOGIN, NivelRiesgo.BAJO, "Inicio de sesion exitoso previo a viaje", ahora.minusDays(1), true)
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