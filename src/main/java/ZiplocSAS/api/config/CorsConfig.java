package ZiplocSAS.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
/**
 * Configura CORS para permitir que el frontend local consuma la API REST.
 */

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Registra las reglas de origen, metodos y cabeceras permitidas.
     *
     * @param registry registro de configuracion CORS provisto por Spring MVC.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
