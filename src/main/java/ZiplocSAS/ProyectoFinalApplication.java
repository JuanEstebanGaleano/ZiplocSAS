package ZiplocSAS;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
/**
 * Clase principal de la plataforma ziplocSAS.
 */

@SpringBootApplication
@EnableScheduling
public class ProyectoFinalApplication {

    /**
     *
     * @param args argumentos de linea de comandos recibidos por la JVM.
     */
    public static void main(String[] args) {
        SpringApplication.run(ProyectoFinalApplication.class, args);
    }

}
