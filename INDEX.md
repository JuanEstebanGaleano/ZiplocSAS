# Plataforma ZIPLOC SAS de Billeteras Digitales

Backend academico en Spring Boot para simular una plataforma ZiplocSAS con usuarios,
billeteras, operaciones financieras, recompensas, operaciones programadas,
alertas, auditoria y analitica de movimientos.

## Modulos principales

- `api.controller`: endpoints REST y manejo uniforme de errores.
- `api.dto`: objetos de entrada/salida de la API.
- `application.service`: reglas de negocio y coordinacion de estructuras.
- `domain.model`: entidades de dominio en memoria.
- `domain.enums`: estados, tipos y niveles usados por la plataforma.
- `domain.structures`: implementaciones propias de listas, pila, colas, arbol,
  tablas hash y grafo.

## Endpoints base

El contexto de la API es `/api`.

- `/api/usuarios`: registrar, listar, modificar, eliminar y consultar ranking por puntos.
- `/api/billeteras`: crear, listar, actualizar, eliminar y consultar saldo.
- `/api/transacciones`: recargar, retirar, transferir, consultar historial y revertir.
- `/api/programadas`: programar y procesar operaciones automaticas.
- `/api/recompensas`: consultar puntos, nivel y canjear beneficios.
- `/api/notificaciones`: listar, despachar y marcar alertas.
- `/api/analitica`: reportes, top de uso, auditoria, grafo, frecuencia y rendimiento.

## Ejecutar

```powershell
$env:JAVA_HOME='C:\Users\Luich\.jdks\openjdk-26.0.1'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cmd /c mvnw.cmd spring-boot:run
```

## Probar

```powershell
$env:JAVA_HOME='C:\Users\Luich\.jdks\openjdk-26.0.1'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cmd /c mvnw.cmd test
```
