import json
import time
import hashlib
import binascii

import ecdsa

# Importaciones locales
from exceptions import InvalidSignatureError, InvalidBlockError, InsufficientFundsError, InvalidTransactionError
from utils import COINBASE_SENDER, MINING_REWARD

class Transaction:
    def __init__(self, sender_pub_key, recipient_pub_key, amount, signature=None):
        self.sender = sender_pub_key
        self.recipient = recipient_pub_key
        self.amount = amount
        self.timestamp = time.time()
        self.signature = signature

    def __repr__(self):
        return (
            f"Transaction(sender={self.sender[:10]}..., recipient={self.recipient[:10]}..., "
            f"amount={self.amount}, timestamp={self.timestamp})"
        )

    def get_signing_data(self):
        """
        Genera la representación canónica de los datos que se firman.
        Es VITAL que `sort_keys=True` para garantizar que el hash sea siempre idéntico.
        La firma no se incluye en los datos que se firman.
        """
        data = {
            "sender": self.sender,
            "recipient": self.recipient,
            "amount": self.amount,
            "timestamp": self.timestamp
        }
        return json.dumps(data, sort_keys=True)

    def sign(self, wallet):
        """Firma la transacción usando la billetera proporcionada."""
        if wallet.get_public_key_hex() != self.sender:
            raise ValueError("La billetera no corresponde al remitente de la transacción.")
        
        self.signature = wallet.sign_transaction(self.get_signing_data())

    def is_valid(self):
        """
        Valida la transacción.
        1. Las transacciones de recompensa (coinbase) son válidas por definición si no tienen firma.
        2. Para otras transacciones, se verifica la firma contra la clave pública del remitente.
        """
        if self.sender == COINBASE_SENDER:
            return True # Las transacciones de recompensa se consideran válidas.
            
        if not self.signature or not self.sender:
            raise InvalidTransactionError("La transacción no tiene firma o remitente.")

        try:
            public_key_bytes = binascii.unhexlify(self.sender)
            verifying_key = ecdsa.VerifyingKey.from_string(public_key_bytes, curve=ecdsa.SECP256k1)
            
            # Verifica la firma contra los datos originales de la transacción.
            is_signature_ok = verifying_key.verify(
                binascii.unhexlify(self.signature),
                self.get_signing_data().encode('utf-8'),
                hashfunc=hashlib.sha256
            )
            return is_signature_ok
        except (binascii.Error, ecdsa.BadSignatureError):
            raise InvalidSignatureError("La firma de la transacción es inválida.")
        except Exception as e:
            raise InvalidTransactionError(f"Error inesperado durante la validación: {e}")

class Block:
    def __init__(self, index, transactions, previous_hash, nonce=0):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def __repr__(self):
        return (
            f"Block(index={self.index}, hash={self.hash[:10]}..., "
            f"previous_hash={self.previous_hash[:10]}..., tx_count={len(self.transactions)})"
        )

    def calculate_hash(self):
        """
        Genera el hash SHA-256 del bloque completo.
        Para asegurar consistencia, las transacciones son serializadas.
        """
        # Serializamos cada transacción de forma consistente
        tx_data = "".join([json.dumps(tx.__dict__, sort_keys=True) for tx in self.transactions])
        
        block_content = f"{self.index}{self.timestamp}{tx_data}{self.previous_hash}{self.nonce}"
        return hashlib.sha256(block_content.encode('utf-8')).hexdigest()

    def mine_block(self, difficulty):
        """
        Algoritmo de Prueba de Trabajo (PoW). Busca un hash que comience con 'N' ceros.
        """
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()

class Blockchain:
    def __init__(self, difficulty=4, initial_beneficiary=None, initial_funds=0):
        self.chain = []
        self.pending_transactions = []
        self.difficulty = difficulty
        
        # Crear el bloque génesis, otorgando fondos iniciales si se especifica
        genesis_transactions = []
        if initial_beneficiary and initial_funds > 0:
            genesis_tx = Transaction(
                sender_pub_key=COINBASE_SENDER,
                recipient_pub_key=initial_beneficiary,
                amount=initial_funds
            )
            genesis_transactions.append(genesis_tx)
            
        self.chain.append(self.create_genesis_block(genesis_transactions))

    def create_genesis_block(self, transactions):
        """Crea el primer bloque de la cadena."""
        genesis_block = Block(index=0, transactions=transactions, previous_hash="0")
        return genesis_block

    def get_latest_block(self):
        """Retorna el último bloque de la cadena."""
        return self.chain[-1]

    def add_transaction(self, transaction):
        """
        Añade una transacción a la lista de pendientes después de validarla.
        Validaciones:
        1. Datos básicos (remitente, receptor, monto).
        2. Firma digital.
        3. Fondos suficientes (excepto para coinbase).
        """
        if not transaction.sender or not transaction.recipient or transaction.amount <= 0:
            raise InvalidTransactionError("La transacción tiene datos incompletos o monto inválido.")

        # La validación de firma es crucial
        transaction.is_valid()

        # No se permite gastar más de lo que se tiene
        if transaction.sender != COINBASE_SENDER:
            sender_balance = self.get_balance(transaction.sender)
            if sender_balance < transaction.amount:
                raise InsufficientFundsError(
                    f"Fondos insuficientes para {transaction.sender[:10]}... "
                    f"(Saldo: {sender_balance}, Necesita: {transaction.amount})"
                )
        
        self.pending_transactions.append(transaction)
        return True

    def mine_pending_transactions(self, miner_reward_address):
        """
        Mina un nuevo bloque con las transacciones pendientes y recompensa al minero.
        """
        if not self.pending_transactions:
            print("No hay transacciones pendientes para minar.")
            return None

        # Recompensa para el minero (transacción coinbase)
        reward_tx = Transaction(
            sender_pub_key=COINBASE_SENDER,
            recipient_pub_key=miner_reward_address,
            amount=MINING_REWARD
        )
        # Añadimos la recompensa al principio de la lista para minarla en este bloque
        block_transactions = [reward_tx] + self.pending_transactions

        last_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            transactions=block_transactions,
            previous_hash=last_block.hash
        )
        
        print(f"\n--- Iniciando minería de bloque {new_block.index} con {len(block_transactions)} transacciones ---")
        start_t = time.time()
        new_block.mine_block(self.difficulty)
        end_t = time.time()
        print(f"Tiempo de cómputo: {end_t - start_t:.4f} segundos.")
        print(f"Bloque #{new_block.index} minado con éxito. Hash: {new_block.hash[:20]}...")

        self.chain.append(new_block)
        self.pending_transactions = [] # Limpiar mempool
        return new_block

    def get_balance(self, wallet_address):
        """Calcula y retorna el saldo de una dirección de billetera recorriendo toda la cadena."""
        balance = 0
        for block in self.chain:
            for tx in block.transactions:
                if tx.recipient == wallet_address:
                    balance += tx.amount
                if tx.sender == wallet_address:
                    balance -= tx.amount
        return balance

    def is_chain_valid(self):
        """
        Auditoría completa de la integridad de la cadena.
        1. Verifica el enlace de hashes entre bloques.
        2. Verifica la integridad del hash de cada bloque.
        3. Verifica la validez de cada transacción dentro de cada bloque.
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            # 1. ¿El hash del bloque es correcto?
            if current_block.hash != current_block.calculate_hash():
                raise InvalidBlockError(f"Hash del bloque {current_block.index} es inválido.")

            # 2. ¿El puntero al hash anterior es correcto?
            if current_block.previous_hash != previous_block.hash:
                raise InvalidBlockError(
                    f"Enlace roto: El hash previo del bloque {current_block.index} "
                    f"no coincide con el hash del bloque {previous_block.index}."
                )
            
            # 3. ¿Todas las transacciones en el bloque son válidas?
            for tx in current_block.transactions:
                try:
                    # Se vuelve a validar cada transacción como parte de la auditoría
                    tx.is_valid()
                except InvalidTransactionError as e:
                    raise InvalidBlockError(f"Transacción inválida en bloque {current_block.index}: {e}")
        return True

    def print_chain(self):
        """Imprime una representación visual de toda la cadena de bloques."""
        print("\n" + "="*30 + " CADENA DE BLOQUES " + "="*30)
        for block in self.chain:
            print(f"\nBloque #{block.index} | Hash: {block.hash}")
            print(f"  Timestamp: {time.ctime(block.timestamp)}")
            print(f"  Nonce: {block.nonce}")
            print(f"  Hash Anterior: {block.previous_hash}")
            print(f"  Transacciones ({len(block.transactions)}):")
            if not block.transactions:
                print("    (No hay transacciones en este bloque)")
            for i, tx in enumerate(block.transactions):
                if tx.sender == COINBASE_SENDER:
                    print(f"    {i+1}. [Recompensa] -> {tx.recipient[:15]}... | +{tx.amount}")
                else:
                    print(f"    {i+1}. {tx.sender[:15]}... -> {tx.recipient[:15]}... | Monto: {tx.amount}")
        print("\n" + "="*80)