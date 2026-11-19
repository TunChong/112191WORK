"""Local QA fixture. No route forwards to an external service."""
import argparse
import base64
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent
FILES = ROOT / 'evidence'
PROFILE = dict(id='qa-user', employee_code='112191', full_name='QA MANAGER', role='manager', active=True, is_admin=False)
MEMBER = dict(id='qa-member', employee_code='234567', full_name='QA STAFF', role='staff', active=True, is_admin=False)
SHOPS = [dict(id=f'qa-{x.lower()}', shop_code=f'QA-{x}', shop_name=f'Fixture {x}', active=True, is_primary=x=='A') for x in ('A', 'B')]
NOTES = [dict(id=f'qa-note-{n}', recipient_id=PROFILE['id'], title=f'Thông báo thử {n}', body='Dữ liệu giả', created_at='2026-11-19T18:00:00Z', read_at=None) for n in (1, 2)]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *_):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "connect-src 'self' blob:; img-src 'self' data: blob:; object-src 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'")
        super().end_headers()

    def send(self, status, data, mime='application/json'):
        raw = data if isinstance(data, bytes) else json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        if self.command != 'HEAD': self.wfile.write(raw)

    def do_GET(self):
        u = urlsplit(self.path)
        path = u.path
        if path.startswith('/qa-api/rest/v1/'):
            table = path.rsplit('/',1)[1]
            query = parse_qs(u.query)
            data = []
            if table == 'profiles': data = [PROFILE]
            if table == 'work_shops': data = SHOPS
            if table == 'work_shop_memberships':
                if 'profile:' in query.get('select',[''])[0]:
                    data = [dict(user_id=p['id'], shop_role=p['role'], active=True, profile=p) for p in (PROFILE,MEMBER)]
                else: data = [dict(shop_id=sh['id'], shop_role='manager', active=True) for sh in SHOPS]
            if table == 'notifications': data = NOTES
            return self.send(200,data)
        if path in ('/stable/audio-demo.mp3','/print/audio-demo.mp3') and self.headers.get('Range'):
            data = (ROOT / path[1:]).read_bytes()
            if (m:=re.fullmatch(r'bytes=(\d+)-(\d*)',self.headers['Range'])):
                start=int(m[1]);end=min(int(m[2]) if m[2] else len(data)-1,len(data)-1)
                if 0<=start<=end:
                    self.send_response(206); self.send_header('Content-Type','audio/mpeg')
                    self.send_header('Content-Range',f'bytes {start}-{end}/{len(data)}');self.send_header('Accept-Ranges','bytes')
                    self.send_header('Content-Length',str(end-start+1));self.end_headers();self.wfile.write(data[start:end+1]);return
        if path.startswith(('/stable/','/print/','/qa/')) or path == '/':
            return super().do_GET()
        return self.send(404,dict(error='QA route missing'))

    def body(self):
        return self.rfile.read(int(self.headers.get('Content-Length', '0')))

    def do_POST(self):
        path=urlsplit(self.path).path
        raw=self.body()
        if path=='/qa/reset':
            for n in NOTES: n['read_at']=None
            return self.send(200,dict(ok=True))
        if path=='/qa/report':
            (FILES/'browser.json').write_bytes(raw)
            return self.send(200,dict(ok=True))
        if path.startswith('/qa/output/'):
            name=path.rsplit('/',1)[-1]
            if re.fullmatch(r'(?:print|quote|inventory)-[a-z0-9-]+\.(?:png|pdf|xlsx|html)',name):
                (FILES/name).write_bytes(raw)
                return self.send(200,dict(bytes=len(raw)))
        if path=='/qa-api/functions/v1/manage-shops': return self.send(200,dict(ready=True))
        if path=='/qa-api/functions/v1/work-push': return self.send(200,dict(enabled=False,sent=0))
        if path=='/qa-api/functions/v1/quote-product':
            data=json.loads(raw)
            return self.send(200,dict(title='Mặt hàng mới QA', image='https://example.invalid/qa-product.png') if data.get('url') else {})
        if path=='/qa-api/functions/v1/quote-image':
            encoded=base64.b64encode((ROOT/'qa/marker.png').read_bytes()).decode()
            return self.send(200,dict(ok=True,data_url='data:image/png;base64,'+encoded))
        return self.send(404,dict(error='QA refuses unsupported writes'))

    def do_PATCH(self):
        u=urlsplit(self.path); data=json.loads(self.body())
        if u.path!='/qa-api/rest/v1/notifications': return self.send(404,dict(error='QA refuses unsupported writes'))
        selected=parse_qs(u.query).get('id',[''])[0]
        records=[item for item in NOTES if selected=='eq.'+item['id']]
        for item in records: item['read_at']=data.get('read_at')
        return self.send(200,records)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=4173);parser.add_argument('--strictPort',action='store_true')
    opts=parser.parse_args();FILES.mkdir(exist_ok=True)
    ThreadingHTTPServer((opts.host,opts.port),Handler).serve_forever()
