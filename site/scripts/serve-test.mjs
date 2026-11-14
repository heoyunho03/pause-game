import http from 'node:http';
import worker from '../dist/_worker.js';
const port=Number(process.env.PORT || 8788);
const server=http.createServer(async(req,res)=>{
  try {
    const body=[];
    for await(const chunk of req) body.push(chunk);
    const request=new Request('http://127.0.0.1:'+port+req.url,{
      method:req.method,headers:req.headers,
      ...(!['GET','HEAD'].includes(req.method) ? {body:Buffer.concat(body)} : {})
    });
    const response=await worker.fetch(request,{});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(500);res.end('Test server error'); }
});
server.listen(port,'127.0.0.1',()=>console.log('READY '+port));
process.on('SIGTERM',()=>server.close());
