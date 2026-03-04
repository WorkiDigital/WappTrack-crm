import base64

with open("/home/ubuntu/wapptrack-insights-hub-79/qrcode_base64.txt", "r") as f:
    base64_string = f.read().strip()

# Remove o prefixo de dados se existir
if "data:image/png;base64," in base64_string:
    base64_string = base64_string.replace("data:image/png;base64,", "")

# Adiciona padding se necessário
missing_padding = len(base64_string) % 4
if missing_padding != 0:
    base64_string += "=" * (4 - missing_padding)

try:
    image_data = base64.b64decode(base64_string)
    
    # Assinatura de um arquivo PNG (8 bytes)
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    if image_data.startswith(png_signature):
        print("A string base64 decodificada começa com a assinatura PNG.")
        with open("/home/ubuntu/wapptrack-insights-hub-79/qrcode_test_2.png", "wb") as f:
            f.write(image_data)
        print("Imagem salva como qrcode_test_2.png")
    else:
        print("A string base64 decodificada NÃO começa com a assinatura PNG.")
        print(f"Primeiros 10 bytes: {image_data[:10]}")
        # Tentar salvar mesmo assim para inspeção manual
        with open("/home/ubuntu/wapptrack-insights-hub-79/qrcode_test_raw.bin", "wb") as f:
            f.write(image_data)
        print("Dados brutos salvos como qrcode_test_raw.bin para inspeção.")

except Exception as e:
    print(f"Erro ao decodificar base64: {e}")

