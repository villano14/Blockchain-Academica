import ecdsa
import binascii
import hashlib

class Wallet:
    def __init__(self):
        # Generación de clave privada usando la curva SECP256k1, estándar en Bitcoin/Ethereum
        # [21, 56] - La aleatoriedad aquí es crítica para la seguridad.
        self.private_key = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
        # Derivación de la clave pública verificadora
        self.public_key = self.private_key.get_verifying_key()
    
    def get_public_key_hex(self):
        # Exportamos la clave pública a formato hexadecimal para usarla como dirección
        return binascii.hexlify(self.public_key.to_string()).decode('utf-8')

    def sign_transaction(self, message_data):
        """
        Firma criptográfica de un mensaje arbitrario.
        Utiliza ECDSA con SHA256 como función de resumen interna.
        """
        # [22, 58] - El mensaje se codifica a bytes antes de firmar
        signature = self.private_key.sign(message_data.encode('utf-8'), hashfunc=hashlib.sha256)
        return binascii.hexlify(signature).decode('utf-8')