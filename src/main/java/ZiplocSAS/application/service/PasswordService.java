package ZiplocSAS.application.service;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
/**
 * Servicio de hashing y verificacion de contrasenas con PBKDF2.
 */

@Service
public class PasswordService {
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int HASH_BITS = 256;
    private static final String FORMAT = "pbkdf2_sha256";

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Genera un hash seguro con sal aleatoria.
     *
     * @param contrasena contrasena en texto plano.
     * @return hash serializado con algoritmo, iteraciones, sal y digest.
     */
    public String generarHash(String contrasena) {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        byte[] hash = calcularHash(contrasena, salt, ITERATIONS);
        return FORMAT + "$" + ITERATIONS + "$" + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Verifica una contrasena contra un hash previamente guardado.
     *
     * @param contrasena contrasena en texto plano.
     * @param hashGuardado hash persistido.
     * @return {@code true} si la contrasena coincide.
     */
    public boolean verificar(String contrasena, String hashGuardado) {
        if (contrasena == null || hashGuardado == null || hashGuardado.isBlank()) {
            return false;
        }

        try {
            String[] partes = hashGuardado.split("\\$");
            if (partes.length != 4 || !FORMAT.equals(partes[0])) {
                return false;
            }

            int iterations = Integer.parseInt(partes[1]);
            byte[] salt = Base64.getDecoder().decode(partes[2]);
            byte[] hashEsperado = Base64.getDecoder().decode(partes[3]);
            byte[] hashRecibido = calcularHash(contrasena, salt, iterations);
            return equalsConstante(hashEsperado, hashRecibido);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private byte[] calcularHash(String contrasena, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(contrasena.toCharArray(), salt, iterations, HASH_BITS);
            return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException ex) {
            throw new IllegalStateException("No fue posible procesar la contrasena", ex);
        }
    }

    private boolean equalsConstante(byte[] esperado, byte[] recibido) {
        if (esperado.length != recibido.length) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < esperado.length; i++) {
            diff |= esperado[i] ^ recibido[i];
        }
        return diff == 0;
    }
}
