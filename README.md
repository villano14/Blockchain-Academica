# Simulador de Blockchain en Python

Este proyecto es un simulador interactivo de blockchain basado en consola, diseñado con fines educativos. Permite a los usuarios entender los conceptos fundamentales de una cadena de bloques, como la creación de transacciones, la minería, la validación de la cadena y la seguridad, a través de la simulación de ataques comunes.

## Requisitos

- Python 3.6+

## Instalación

1.  **Clona el repositorio (si aún no lo has hecho):**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_DIRECTORIO>
    ```

2.  **Crea y activa un entorno virtual:**
    ```bash
    # Para Unix/macOS
    python3 -m venv .venv
    source .venv/bin/activate

    # Para Windows
    python -m venv .venv
    .venv\Scripts\activate
    ```

3.  **Instala las dependencias:**
    El proyecto requiere la biblioteca `ecdsa` para la firma de transacciones con curvas elípticas.
    ```bash
    pip install ecdsa
    ```

## Cómo usar

Para iniciar el simulador, simplemente ejecuta el archivo `main.py`:

```bash
python main.py
```

Al iniciar, la aplicación crea automáticamente tres billeteras (`alice`, `bob`, `miner`) y le otorga a `alice` un saldo inicial como parte del bloque génesis.

### Menú de Opciones

Una vez que el simulador esté en funcionamiento, verás un menú con las siguientes opciones:

1.  **Añadir transacción:**
    Te permite crear y enviar una transacción desde una billetera a otra. Deberás especificar el remitente, el destinatario y el monto. La transacción se añadirá a la lista de transacciones pendientes, a la espera de ser minada.

2.  **Minar bloque:**
    Inicia el proceso de minería. Agrupa todas las transacciones pendientes en un nuevo bloque, resuelve el desafío de prueba de trabajo (Proof-of-Work) y añade el bloque a la cadena. El minero que elijas recibirá una recompensa.

3.  **Mostrar Blockchain:**
    Imprime en la consola una representación completa y detallada de toda la cadena de bloques, desde el bloque génesis hasta el más reciente. También muestra los balances actuales de todas las billeteras.

4.  **Validar Cadena:**
    Realiza una auditoría completa de la cadena para verificar su integridad. Comprueba que todos los hashes de los bloques sean correctos y que todas las firmas de las transacciones sean válidas.

5.  **Simular: Ataque de Inmutabilidad (Post-Minado):**
    Este escenario te permite intentar modificar una transacción dentro de un bloque que ya ha sido minado. Después del ataque, puedes usar la opción "Validar Cadena" para ver cómo la blockchain detecta la corrupción.

6.  **Simular: Ataque de Firma Inválida (Pre-Minado):**
    Simula un ataque en el que un actor malicioso intercepta los datos de una transacción, los altera (por ejemplo, cambiando el monto o el destinatario) e intenta retransmitirla usando la firma original. El sistema debería detectar que la firma ya no corresponde con el contenido y rechazarla.

7.  **Simular: Ataque de Doble Gasto:**
    En este escenario, se intenta gastar los mismos fondos más de una vez. El simulador intentará crear dos transacciones diferentes desde la misma fuente por el mismo monto y enviarlas a la red. El sistema debería aceptar la primera y rechazar la segunda por fondos insuficientes.

8.  **Salir:**
    Termina la ejecución del simulador.
