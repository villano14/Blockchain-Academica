"""
Contiene las clases de excepción personalizadas para la simulación de la blockchain.
"""

class BlockchainError(Exception):
    """Clase base para otras excepciones de la blockchain."""
    pass

class InvalidTransactionError(BlockchainError):
    """Se lanza cuando una transacción es inválida por alguna razón (datos, etc.)."""
    pass

class InvalidSignatureError(InvalidTransactionError):
    """Se lanza específicamente cuando la firma de una transacción es inválida."""
    pass

class InsufficientFundsError(InvalidTransactionError):
    """Se lanza cuando una billetera intenta gastar más fondos de los que tiene."""
    pass

class InvalidBlockError(BlockchainError):
    """Se lanza cuando un bloque es inválido (hash incorrecto, etc.)."""
    pass