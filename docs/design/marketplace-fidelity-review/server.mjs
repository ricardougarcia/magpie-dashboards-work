// Local-only comparison. The actual Next page is proxied unchanged.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const directory = fileURLToPath(new URL('.', import.meta.url));
const server = http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path.startsWith('/__review/')) {
    const name = path === '/__review/' ? 'index.html' : path.slice(10);
    if (!['index.html','reference.html'].includes(name)) { res.writeHead(404).end(); return; }
    try {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end(await readFile(directory+name));}
    catch {res.writeHead(500).end('Review file unavailable');}
    return;
  }
  const proxy = http.request({hostname:'127.0.0.1',port:3019,path:req.url,method:req.method,headers:req.headers},upstream=>{
    res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
  });
  proxy.on('error',()=>res.writeHead(502).end('Start the Next server on port3019.'));
  req.pipe(proxy);
});
server.on('upgrade',(req,socket,head)=>{
  const proxy=http.request({hostname:'127.0.0.1',port:3019,path:req.url,headers:req.headers});
  proxy.on('upgrade',(response,upstream,upstreamHead)=>{
    socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`+Object.entries(response.headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');
    if(head.length) upstream.write(head);
    if(upstreamHead.length) socket.write(upstreamHead);
    upstream.pipe(socket);socket.pipe(upstream);
    upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());
  });
  proxy.on('error',()=>socket.destroy());proxy.end();
});
server.listen(3033,'127.0.0.1',()=>console.log('Review: http://127.0.0.1:3033/__review/'));
