# Estructuras de datos aplicadas

## Listas

Se usan en los historiales de transacciones por billetera, beneficios
canjeados, operaciones procesadas y reportes por periodo.

Justificacion: permiten conservar orden cronologico y recorrer el historial
para reportes y filtros.

## Pila

`GestorTransacciones` mantiene una pila de transacciones reversibles.

Justificacion: la operacion mas reciente puede revertirse en O(1), imitando
un historial de deshacer.

## Cola circular

`ColaNotificaciones` conserva las alertas recientes por usuario con capacidad
maxima.

Justificacion: limita memoria y descarta automaticamente la alerta mas antigua
cuando se llena.

## Cola de prioridad

`ColaProgramadas` implementa un heap minimo por fecha de ejecucion y prioridad.

Justificacion: siempre procesa primero la operacion programada mas urgente.

## Arbol

`ArbolFidelizacion` organiza usuarios por puntos acumulados.

Justificacion: facilita reportes ordenados, top de puntos y busquedas por rango.

## Tablas hash

- `TablaUsuarios`: hash con encadenamiento separado.
- `TablaBilleteras`: hash con direccionamiento abierto y sondeo lineal.

Justificacion: aceleran busquedas por identificador, consulta de saldo y
actualizaciones frecuentes.

## Grafo

`GrafoTransferencias` representa movimientos entre usuarios como aristas
ponderadas por monto.

Justificacion: permite analizar vecinos, montos transferidos, conexiones,
ciclos y patrones de relacion financiera.

## Estructuras ordenadas

`GestorTransacciones.obtenerMayoresValores` ordena el historial por valor para
consultar las transacciones mas altas.

Justificacion: cubre el requisito de extraer operaciones de mayor valor y deja
la comparacion clara para el informe tecnico.
