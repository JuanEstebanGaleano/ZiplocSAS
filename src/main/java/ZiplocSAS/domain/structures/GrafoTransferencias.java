package ZiplocSAS.domain.structures;

import java.util.*;
/**
 * Grafo dirigido ponderado que representa transferencias entre usuarios.
 */

public class GrafoTransferencias {
    private Map<String, List<Arista>> adyacencia;
    private Set<String> vertices;

    private static class Arista {
        String destino;
        double peso; // Monto total transferido

        Arista(String destino, double peso) {
            this.destino = destino;
            this.peso = peso;
        }
    }

    public GrafoTransferencias() {
        this.adyacencia = new HashMap<>();
        this.vertices = new HashSet<>();
    }

    /**
     * Agrega un vÃ©rtice (usuario) al grafo
     */
    public void agregarVertice(String usuarioId) {
        if (!adyacencia.containsKey(usuarioId)) {
            adyacencia.put(usuarioId, new ArrayList<>());
            vertices.add(usuarioId);
            imprimir("agregar vertice " + usuarioId);
            return;
        }
        imprimir("agregar vertice " + usuarioId + " -> ya existia");
    }

    /**
     * Agrega una arista ponderada (transferencia) entre usuarios
     */
    public void agregarArista(String origen, String destino, double monto) {
        agregarVertice(origen);
        agregarVertice(destino);

        List<Arista> aristas = adyacencia.get(origen);
        for (Arista arista : aristas) {
            if (arista.destino.equals(destino)) {
                arista.peso += monto; // Suma de transferencias
                imprimir("actualizar arista " + origen + " -> " + destino + " monto +" + monto);
                return;
            }
        }

        aristas.add(new Arista(destino, monto));
        imprimir("agregar arista " + origen + " -> " + destino + " monto " + monto);
    }

    public List<String> obtenerVecinos(String usuarioId) {
        List<String> vecinos = new ArrayList<>();
        List<Arista> aristas = adyacencia.get(usuarioId);
        if (aristas != null) {
            for (Arista arista : aristas) {
                vecinos.add(arista.destino);
            }
        }
        imprimir("obtener vecinos de " + usuarioId);
        return vecinos;
    }

    /**
     * Obtiene el monto total transferido a un destino especÃ­fico
     */
    public double obtenerMonto(String origen, String destino) {
        List<Arista> aristas = adyacencia.get(origen);
        if (aristas != null) {
            for (Arista arista : aristas) {
                if (arista.destino.equals(destino)) {
                    imprimir("obtener monto " + origen + " -> " + destino + " = " + arista.peso);
                    return arista.peso;
                }
            }
        }
        imprimir("obtener monto " + origen + " -> " + destino + " = 0");
        return 0.0;
    }

    /**
     * Detecta ciclos en el grafo (transferencias circulares)
     */
    public boolean detectarCiclos() {
        Set<String> visitados = new HashSet<>();
        Set<String> enRecursion = new HashSet<>();

        for (String vertice : vertices) {
            if (!visitados.contains(vertice)) {
                if (detectarCiclosRecursivo(vertice, visitados, enRecursion)) {
                    imprimir("detectar ciclos -> si");
                    return true;
                }
            }
        }
        imprimir("detectar ciclos -> no");
        return false;
    }

    /**
     * Encuentra todas las rutas entre dos usuarios
     */
    public List<List<String>> encontrarRutas(String origen, String destino) {
        List<List<String>> rutas = new ArrayList<>();
        List<String> ruta = new ArrayList<>();
        Set<String> visitados = new HashSet<>();
        encontrarRutasRecursivo(origen, destino, visitados, ruta, rutas);
        imprimir("encontrar rutas " + origen + " -> " + destino);
        return rutas;
    }

    /**
     * Analiza conexiones de un usuario (entrada y salida)
     */
    public Map<String, Object> analizarConexiones(String usuarioId) {
        Map<String, Object> analisis = new HashMap<>();

        // Conexiones salientes
        int conexionesSalientes = obtenerVecinos(usuarioId).size();
        double montoTotalSaliente = 0.0;

        List<Arista> aristas = adyacencia.get(usuarioId);
        if (aristas != null) {
            for (Arista arista : aristas) {
                montoTotalSaliente += arista.peso;
            }
        }

        analisis.put("conexionesSalientes", conexionesSalientes);
        analisis.put("montoTotalSaliente", montoTotalSaliente);
        analisis.put("conexionesEntrantes", contarEntrantes(usuarioId));
        analisis.put("montoTotalEntrante", calcularMontoEntrante(usuarioId));

        imprimir("analizar conexiones de " + usuarioId);
        return analisis;
    }

    public int cantidadVertices() {
        imprimir("consultar cantidad de vertices");
        return vertices.size();
    }

    public Set<String> obtenerVertices() {
        imprimir("obtener vertices");
        return new HashSet<>(vertices);
    }

    public Map<String, Double> obtenerDestinosPonderados(String usuarioId) {
        Map<String, Double> destinos = new HashMap<>();
        List<Arista> aristas = adyacencia.get(usuarioId);
        if (aristas != null) {
            for (Arista arista : aristas) {
                destinos.put(arista.destino, arista.peso);
            }
        }
        imprimir("obtener destinos ponderados de " + usuarioId);
        return destinos;
    }

    private int contarEntrantes(String usuarioId) {
        int total = 0;
        for (List<Arista> aristas : adyacencia.values()) {
            for (Arista arista : aristas) {
                if (arista.destino.equals(usuarioId)) {
                    total++;
                }
            }
        }
        return total;
    }

    private double calcularMontoEntrante(String usuarioId) {
        double total = 0.0;
        for (List<Arista> aristas : adyacencia.values()) {
            for (Arista arista : aristas) {
                if (arista.destino.equals(usuarioId)) {
                    total += arista.peso;
                }
            }
        }
        return total;
    }


    private boolean detectarCiclosRecursivo(String vertice, Set<String> visitados, Set<String> enRecursion) {
        visitados.add(vertice);
        enRecursion.add(vertice);

        List<Arista> aristas = adyacencia.get(vertice);
        if (aristas != null) {
            for (Arista arista : aristas) {
                if (!visitados.contains(arista.destino)) {
                    if (detectarCiclosRecursivo(arista.destino, visitados, enRecursion)) {
                        return true;
                    }
                } else if (enRecursion.contains(arista.destino)) {
                    return true;
                }
            }
        }

        enRecursion.remove(vertice);
        return false;
    }

    private void encontrarRutasRecursivo(String actual, String destino, Set<String> visitados,
                                        List<String> ruta, List<List<String>> rutas) {
        visitados.add(actual);
        ruta.add(actual);

        if (actual.equals(destino)) {
            rutas.add(new ArrayList<>(ruta));
        } else {
            List<Arista> aristas = adyacencia.get(actual);
            if (aristas != null) {
                for (Arista arista : aristas) {
                    if (!visitados.contains(arista.destino)) {
                        encontrarRutasRecursivo(arista.destino, destino, visitados, ruta, rutas);
                    }
                }
            }
        }

        ruta.remove(ruta.size() - 1);
        visitados.remove(actual);
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Grafo dirigido ponderado con lista de adyacencia").append(System.lineSeparator());
        estado.append("Vertices: ").append(vertices.size()).append(System.lineSeparator());
        for (String vertice : vertices) {
            estado.append(vertice).append(" -> ");
            List<Arista> aristas = adyacencia.get(vertice);
            if (aristas == null || aristas.isEmpty()) {
                estado.append("[]");
            } else {
                for (int i = 0; i < aristas.size(); i++) {
                    Arista arista = aristas.get(i);
                    if (i > 0) {
                        estado.append(", ");
                    }
                    estado.append(arista.destino).append("(monto=").append(arista.peso).append(")");
                }
            }
            estado.append(System.lineSeparator());
        }
        EstructuraConsolePrinter.imprimir("GrafoTransferencias", accion, estado.toString());
    }
}

