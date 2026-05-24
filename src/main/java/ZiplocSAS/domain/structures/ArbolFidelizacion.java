package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.Usuario;
import java.util.*;
/**
 * Arbol AVL que ordena usuarios por puntos de fidelizacion.
 *
 * <p>Permite consultas por rango y rankings de usuarios con mas puntos.</p>
 */

public class ArbolFidelizacion {
    private Node root;
    private int size;

    private static class Node {
        Usuario usuario;
        Node left;
        Node right;
        int height;

        Node(Usuario usuario) {
            this.usuario = usuario;
            this.height = 1;
        }
    }

    /**
     * Crea un arbol vacio.
     */
    public ArbolFidelizacion() {
        this.root = null;
        this.size = 0;
    }

    /**
     * Inserta o reemplaza un usuario dentro del arbol.
     *
     * @param usuario usuario a indexar por puntos.
     */
    public void insertar(Usuario usuario) {
        if (buscar(usuario.getId()) != null) {
            eliminar(usuario.getId());
        }
        root = insertarRecursivo(root, usuario);
        size++;
        imprimir("insertar usuario " + usuario.getId());
    }

    /**
     * Busca usuarios cuyo puntaje cae dentro de un rango inclusivo.
     *
     * @param minPuntos limite inferior.
     * @param maxPuntos limite superior.
     * @return usuarios encontrados.
     */
    public List<Usuario> buscarPorRango(int minPuntos, int maxPuntos) {
        List<Usuario> resultado = new ArrayList<>();
        buscarPorRangoRecursivo(root, minPuntos, maxPuntos, resultado);
        imprimir("buscar por rango de puntos " + minPuntos + " - " + maxPuntos);
        return resultado;
    }

    /**
     * Obtiene los usuarios con mayor puntaje.
     *
     * @param n cantidad maxima de usuarios.
     * @return ranking descendente por puntos.
     */
    public List<Usuario> obtenerTop(int n) {
        List<Usuario> todos = recorridoInOrder();
        Collections.reverse(todos);
        imprimir("obtener top " + n);
        return todos.subList(0, Math.min(n, todos.size()));
    }

    public void actualizar(Usuario usuario) {
        eliminar(usuario.getId());
        insertar(usuario);
        imprimir("actualizar usuario " + usuario.getId());
    }

    public List<Usuario> recorridoInOrder() {
        List<Usuario> resultado = new ArrayList<>();
        recorridoInOrderRecursivo(root, resultado);
        imprimir("recorrido in-order");
        return resultado;
    }

    public Usuario buscar(String usuarioId) {
        Usuario usuario = buscarRecursivo(root, usuarioId);
        imprimir("buscar usuario " + usuarioId + " -> " + (usuario == null ? "no encontrado" : "encontrado"));
        return usuario;
    }

    public boolean eliminar(String usuarioId) {
        boolean[] eliminado = new boolean[] { false };
        root = eliminarRecursivo(root, usuarioId, eliminado);
        if (eliminado[0]) {
            size--;
        }
        imprimir("eliminar usuario " + usuarioId + (eliminado[0] ? "" : " -> no encontrado"));
        return eliminado[0];
    }

    public int size() {
        return size;
    }

    private Node insertarRecursivo(Node nodo, Usuario usuario) {
        if (nodo == null) {
            return new Node(usuario);
        }

        if (usuario.getPuntosAcumulados() < nodo.usuario.getPuntosAcumulados()) {
            nodo.left = insertarRecursivo(nodo.left, usuario);
        } else {
            nodo.right = insertarRecursivo(nodo.right, usuario);
        }

        nodo.height = 1 + Math.max(getHeight(nodo.left), getHeight(nodo.right));
        return nodo;
    }

    private Usuario buscarRecursivo(Node nodo, String usuarioId) {
        if (nodo == null) {
            return null;
        }

        if (nodo.usuario.getId().equals(usuarioId)) {
            return nodo.usuario;
        }

        Usuario izq = buscarRecursivo(nodo.left, usuarioId);
        if (izq != null) {
            return izq;
        }

        return buscarRecursivo(nodo.right, usuarioId);
    }

    private Node eliminarRecursivo(Node nodo, String usuarioId, boolean[] eliminado) {
        if (nodo == null) {
            return null;
        }

        if (nodo.usuario.getId().equals(usuarioId)) {
            eliminado[0] = true;
            if (nodo.left == null) {
                return nodo.right;
            } else if (nodo.right == null) {
                return nodo.left;
            }

            Node minDerecha = encontrarMin(nodo.right);
            nodo.usuario = minDerecha.usuario;
            nodo.right = eliminarRecursivo(nodo.right, minDerecha.usuario.getId(), new boolean[] { false });
        } else {
            nodo.left = eliminarRecursivo(nodo.left, usuarioId, eliminado);
            if (!eliminado[0]) {
                nodo.right = eliminarRecursivo(nodo.right, usuarioId, eliminado);
            }
        }

        nodo.height = 1 + Math.max(getHeight(nodo.left), getHeight(nodo.right));
        return nodo;
    }

    private void buscarPorRangoRecursivo(Node nodo, int min, int max, List<Usuario> resultado) {
        if (nodo == null) {
            return;
        }

        int puntos = nodo.usuario.getPuntosAcumulados();

        if (puntos >= min) {
            buscarPorRangoRecursivo(nodo.left, min, max, resultado);
        }

        if (puntos >= min && puntos <= max) {
            resultado.add(nodo.usuario);
        }

        if (puntos <= max) {
            buscarPorRangoRecursivo(nodo.right, min, max, resultado);
        }
    }

    private void recorridoInOrderRecursivo(Node nodo, List<Usuario> resultado) {
        if (nodo == null) {
            return;
        }

        recorridoInOrderRecursivo(nodo.left, resultado);
        resultado.add(nodo.usuario);
        recorridoInOrderRecursivo(nodo.right, resultado);
    }

    private Node encontrarMin(Node nodo) {
        while (nodo.left != null) {
            nodo = nodo.left;
        }
        return nodo;
    }

    private int getHeight(Node nodo) {
        return nodo == null ? 0 : nodo.height;
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Arbol binario de fidelizacion ordenado por puntos").append(System.lineSeparator());
        estado.append("Tamano: ").append(size).append(System.lineSeparator());
        estado.append("Altura raiz: ").append(getHeight(root)).append(System.lineSeparator());
        imprimirNodo(root, estado, "", "root");
        EstructuraConsolePrinter.imprimir("ArbolFidelizacion", accion, estado.toString());
    }

    private void imprimirNodo(Node nodo, StringBuilder estado, String prefijo, String lado) {
        if (nodo == null) {
            estado.append(prefijo).append(lado).append(" -> null").append(System.lineSeparator());
            return;
        }
        estado.append(prefijo)
                .append(lado)
                .append(" -> ")
                .append(nodo.usuario.getId())
                .append(" (")
                .append(nodo.usuario.getNombre())
                .append(", puntos=")
                .append(nodo.usuario.getPuntosAcumulados())
                .append(", altura=")
                .append(nodo.height)
                .append(")")
                .append(System.lineSeparator());
        imprimirNodo(nodo.left, estado, prefijo + "  ", "L");
        imprimirNodo(nodo.right, estado, prefijo + "  ", "R");
    }
}
