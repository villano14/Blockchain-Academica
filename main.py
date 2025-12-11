import time
import os

# Importaciones locales
from blockchain import Blockchain, Transaction
from wallet import Wallet
from utils import INITIAL_FUNDS
from exceptions import InsufficientFundsError, InvalidTransactionError, InvalidBlockError, InvalidSignatureError

def clear_screen():
    """Limpia la pantalla de la consola."""
    os.system('cls' if os.name == 'nt' else 'clear')

def wait_for_enter():
    """Espera a que el usuario presione Enter para continuar."""
    input("\nPresiona Enter para volver al menú...")

class App:
    def __init__(self):
        self.wallets = {
            "alice": Wallet(),
            "bob": Wallet(),
            "miner": Wallet(),
        }
        self.blockchain = Blockchain(
            difficulty=4,
            initial_beneficiary=self.wallets["alice"].get_public_key_hex(),
            initial_funds=INITIAL_FUNDS
        )
        print("Simulador de Blockchain inicializado.")
        print(f"Se han creado 3 billeteras: Alice, Bob, y Miner.")
        print(f"Alice ha recibido {INITIAL_FUNDS} monedas en el bloque génesis como fondos iniciales.")

    def print_balances(self):
        print("\n--- Balances Actuales ---")
        for name, wallet in self.wallets.items():
            balance = self.blockchain.get_balance(wallet.get_public_key_hex())
            print(f"  - {name.capitalize()}: {balance} monedas (Dirección: {wallet.get_public_key_hex()[:15]}...)")

    def add_transaction(self):
        clear_screen()
        print("--- Añadir Nueva Transacción ---")
        self.print_balances()

        try:
            sender_name = input("Remitente (ej. alice, bob): ").lower()
            recipient_name = input("Receptor (ej. bob, miner): ").lower()
            amount_str = input("Monto a enviar: ")
            amount = float(amount_str)

            sender_wallet = self.wallets.get(sender_name)
            recipient_wallet = self.wallets.get(recipient_name)

            if not sender_wallet or not recipient_wallet:
                print("\nError: Nombre de billetera no válido.")
                return

            tx = Transaction(
                sender_wallet.get_public_key_hex(),
                recipient_wallet.get_public_key_hex(),
                amount
            )
            tx.sign(sender_wallet)

            self.blockchain.add_transaction(tx)
            print(f"\nÉxito: Transacción de {amount} de {sender_name} a {recipient_name} añadida a transacciones pendientes.")

        except (ValueError, TypeError):
            print("\nError: Monto inválido. Debe ser un número.")
        except (InsufficientFundsError, InvalidTransactionError) as e:
            print(f"\nError al añadir transacción: {e}")
        except Exception as e:
            print(f"\nOcurrió un error inesperado: {e}")

    def mine_block(self):
        clear_screen()
        print("--- Minar Bloque ---")
        miner_name = input("¿Quién minará el bloque? (ej. miner, alice): ").lower()
        miner_wallet = self.wallets.get(miner_name)

        if not miner_wallet:
            print("\nError: Nombre de minero no válido.")
            return

        mined_block = self.blockchain.mine_pending_transactions(miner_wallet.get_public_key_hex())
        if not mined_block:
            print("\nEl bloque no fue minado (puede que no hubiera transacciones pendientes).")

    def show_blockchain(self):
        clear_screen()
        self.blockchain.print_chain()
        self.print_balances()

    def validate_chain(self):
        clear_screen()
        print("--- Auditoría de la Cadena de Bloques ---")
        try:
            self.blockchain.is_chain_valid()
            print("\nResultado: ¡La cadena es VÁLIDA!")
            print("Todos los hashes son correctos y todas las transacciones son válidas.")
        except InvalidBlockError as e:
            print("\nResultado: ¡LA CADENA ES CORRUPTA!")
            print(f"  Razón: {e}")

    def run_immutability_attack(self):
        clear_screen()
        print("--- Escenario 4: Ataque a la Inmutabilidad (Post-Minado) ---")
        print("Este ataque intenta modificar datos en un bloque que ya ha sido minado.")
        
        if len(self.blockchain.chain) < 2:
            print("\nNecesitas al menos un bloque minado (además del génesis) para este ataque.")
            return

        try:
            block_idx_str = input(f"Elige un bloque para atacar (1 a {len(self.blockchain.chain) - 1}): ")
            block_idx = int(block_idx_str)
            tx_idx_str = input(f"Elige una transacción para alterar en el bloque {block_idx} (empieza en 0): ")
            tx_idx = int(tx_idx_str)
            new_amount_str = input("Introduce el nuevo monto fraudulento (ej. 9999): ")
            new_amount = float(new_amount_str)

            # Modificación directa en la memoria (el ataque)
            attacked_block = self.blockchain.chain[block_idx]
            original_amount = attacked_block.transactions[tx_idx].amount
            attacked_block.transactions[tx_idx].amount = new_amount
            
            print(f"\n¡Ataque realizado! Se cambió el monto de la transacción {tx_idx} del bloque {block_idx} de {original_amount} a {new_amount}.")
            print("Ahora, se ejecutará la auditoría de la cadena para ver si detecta la corrupción.")
            
            wait_for_enter()
            self.validate_chain()

        except (ValueError, IndexError):
            print("\nError: Índice de bloque o transacción no válido.")
        except Exception as e:
            print(f"\nOcurrió un error inesperado: {e}")

    def run_invalid_signature_attack(self):
        clear_screen()
        print("--- Escenario 5: Ataque con Firma Inválida (Pre-Minado) ---")
        print("Un atacante intercepta una transacción y altera su contenido antes de que llegue al minero.")
        
        # El atacante (Eva) crea una transacción legítima para espiar la firma
        tx_legitima = Transaction(self.wallets["alice"].get_public_key_hex(), self.wallets["bob"].get_public_key_hex(), 1)
        tx_legitima.sign(self.wallets["alice"])
        print("\n1. Alice crea una transacción legítima para Bob por 1 moneda y la firma.")

        # Ahora Eva crea una transacción fraudulenta, cambiando el destinatario a ella misma.
        print("2. Un atacante intercepta los datos y crea una transacción fraudulenta, cambiando el monto a 1000.")
        tx_fraudulenta = Transaction(
            self.wallets["alice"].get_public_key_hex(), # Remitente original
            self.wallets["miner"].get_public_key_hex(), # Receptor cambiado (el atacante)
            1000  # Monto alterado
        )

        # Eva roba la firma de la transacción legítima y la pone en la fraudulenta.
        tx_fraudulenta.signature = tx_legitima.signature
        print("3. El atacante pega la firma de la transacción legítima en la fraudulenta.")

        print("\n4. El atacante intenta añadir la transacción fraudulenta a la red...")
        time.sleep(2)
        try:
            self.blockchain.add_transaction(tx_fraudulenta)
            print("\nFALLO DEL ATAQUE: ¡Esto no debería haber ocurrido!")
        except InvalidSignatureError as e:
            print(f"\nÉXITO DE LA DEFENSA: La red rechazó la transacción.")
            print(f"  Razón: {e}")

    def run_double_spend_attack(self):
        clear_screen()
        print("--- Escenario 6: Ataque de Doble Gasto ---")
        alice_addr = self.wallets["alice"].get_public_key_hex()
        balance = self.blockchain.get_balance(alice_addr)
        print(f"Alice tiene un saldo de: {balance} monedas.")
        
        if balance <= 0:
            print("\nAlice no tiene fondos. Por favor, añade fondos a Alice antes de este ataque.")
            return
            
        amount_to_spend = balance * 0.75
        print(f"\n1. Alice decide gastar {amount_to_spend} monedas (75% de su saldo).")
        
        # Crea dos transacciones con el mismo dinero
        tx1 = Transaction(alice_addr, self.wallets["bob"].get_public_key_hex(), amount_to_spend)
        tx1.sign(self.wallets["alice"])
        print(f"2. Crea una transacción para Bob por {amount_to_spend} monedas.")

        tx2 = Transaction(alice_addr, self.wallets["miner"].get_public_key_hex(), amount_to_spend)
        tx2.sign(self.wallets["alice"])
        print(f"3. Inmediatamente, crea otra transacción para Miner por el mismo monto de {amount_to_spend} monedas.")

        print("\n4. Intenta añadir ambas transacciones a las pendientes...")
        time.sleep(2)
        try:
            # La primera transacción debería ser exitosa
            self.blockchain.add_transaction(tx1)
            print("  - La primera transacción (para Bob) fue aceptada en las pendientes.")
            
            # La segunda debería fallar por falta de fondos (ya que el saldo se compromete con la primera)
            self.blockchain.add_transaction(tx2)
            print("\nFALLO DEL ATAQUE: ¡La segunda transacción no debería haber sido aceptada!")

        except InsufficientFundsError as e:
            print(f"\n  - ÉXITO DE LA DEFENSA: La segunda transacción (para Miner) fue rechazada.")
            print(f"    Razón: {e}")
        except Exception as e:
            print(f"\nOcurrió un error inesperado: {e}")

def main_menu(app):
    """Muestra el menú principal y maneja la selección del usuario."""
    menu_options = {
        "1": "Añadir transacción",
        "2": "Minar bloque",
        "3": "Mostrar Blockchain",
        "4": "Validar Cadena",
        "5": "Simular: Ataque de Inmutabilidad (Post-Minado)",
        "6": "Simular: Ataque de Firma Inválida (Pre-Minado)",
        "7": "Simular: Ataque de Doble Gasto",
        "8": "Salir"
    }

    while True:
        clear_screen()
        print("======= Simulador de Blockchain Académico ======")
        app.print_balances()
        print("\nMenú de Opciones:")
        for key, value in menu_options.items():
            print(f"  {key}. {value}")
        
        choice = input("\nElige una opción: ")

        if choice == "1":
            app.add_transaction()
            wait_for_enter()
        elif choice == "2":
            app.mine_block()
            wait_for_enter()
        elif choice == "3":
            app.show_blockchain()
            wait_for_enter()
        elif choice == "4":
            app.validate_chain()
            wait_for_enter()
        elif choice == "5":
            app.run_immutability_attack()
            wait_for_enter()
        elif choice == "6":
            app.run_invalid_signature_attack()
            wait_for_enter()
        elif choice == "7":
            app.run_double_spend_attack()
            wait_for_enter()
        elif choice == "8":
            print("Saliendo del simulador.")
            break
        else:
            print("Opción no válida. Inténtalo de nuevo.")
            time.sleep(1)

if __name__ == "__main__":
    try:
        app_instance = App()
        main_menu(app_instance)
    except Exception as e:
        print(f"\nHa ocurrido un error fatal en la aplicación: {e}")
        print("Por favor, reinicia el simulador.")
