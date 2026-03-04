import base64

with open('/home/ubuntu/wapptrack-insights-hub-79/qrcode_base64.txt', 'r') as f:
    base64_string = f.read().strip()

# Remove o prefixo de dados se existir
if 'data:image/png;base64,' in base64_string:
    base64_string = base64_string.replace('data:image/png;base64,', '')

# Adiciona padding se necessário
missing_padding = len(base64_string) % 4
if missing_padding != 0:
    base64_string += '=' * (4 - missing_padding)

image_data = base64.b64decode(base64_string)

with open('/home/ubuntu/wapptrack-insights-hub-79/qrcode_test.png', 'wb') as f:
    f.write(image_data)

