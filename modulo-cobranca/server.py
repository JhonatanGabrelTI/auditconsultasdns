#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor HTTP Simples - Módulo de Cobrança
Python 3 (sem dependências externas)
"""

import http.server
import socketserver
import json
from datetime import datetime

PORT = 3001

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_html()
        elif self.path == '/health':
            self.send_json({
                "status": "OK",
                "modulo": "Cobrança Bradesco",
                "versao": "1.0.0",
                "timestamp": datetime.now().isoformat()
            })
        elif self.path == '/boletos':
            self.send_json({
                "sucesso": True,
                "boletos": [],
                "mensagem": "Lista de boletos (mock)"
            })
        else:
            self.send_json({"erro": "Rota não encontrada"}, 404)
    
    def do_POST(self):
        if self.path == '/boletos':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                print(f"[POST /boletos] {data}")
            except:
                data = {}
            
            self.send_json({
                "sucesso": True,
                "mensagem": "Boleto emitido",
                "boleto": {
                    "id": f"BOL-{datetime.now().timestamp()}",
                    "nossoNumero": f"00000{hash(datetime.now()) % 100000}",
                    "seuNumero": data.get("seuNumero", "DOC001"),
                    "valor": data.get("valor", 0)
                }
            }, 201)
        elif self.path == '/webhook/bradesco':
            self.send_json({"recebido": True})
        else:
            self.send_json({"erro": "Rota não encontrada"}, 404)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
    
    def send_html(self):
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Módulo de Cobrança</title>
    <style>
        body {{ font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }}
        h1 {{ color: #333; margin-bottom: 10px; }}
        .status {{ background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .endpoint {{ background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }}
        button {{ background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; }}
        button:hover {{ background: #764ba2; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🏦 Módulo de Cobrança</h1>
        <p>Bradesco API v1.7.1</p>
        
        <div class="status">
            <strong>✅ Servidor Online!</strong><br>
            Porta: {PORT}<br>
            Horário: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        </div>
        
        <h3>Endpoints:</h3>
        <div class="endpoint">GET /health - Status</div>
        <div class="endpoint">POST /boletos - Emitir boleto</div>
        <div class="endpoint">GET /boletos - Listar</div>
        
        <button onclick="testarAPI()">🚀 Testar API</button>
        <div id="resultado" style="margin-top:20px;"></div>
    </div>
    
    <script>
        async function testarAPI() {{
            try {{
                const r = await fetch('/health');
                const data = await r.json();
                document.getElementById('resultado').innerHTML = 
                    '<pre style="background:#f4f4f4;padding:10px;border-radius:5px;">' + 
                    JSON.stringify(data, null, 2) + '</pre>';
            }} catch(e) {{
                document.getElementById('resultado').innerHTML = 
                    '<div style="color:red;">Erro: ' + e.message + '</div>';
            }}
        }}
    </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode())

if __name__ == "__main__":
    print("=" * 50)
    print("   MÓDULO DE COBRANÇA - BRADESCO")
    print("=" * 50)
    print(f"\n🚀 Servidor iniciado em:")
    print(f"   http://localhost:{PORT}")
    print(f"   http://127.0.0.1:{PORT}")
    print(f"\n⏹️  Pressione Ctrl+C para parar\n")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Servidor encerrado!")
