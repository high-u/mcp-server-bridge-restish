import http from 'http';
import { URL } from 'url';

const PORT = process.argv[2] || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (parsedUrl.pathname === '/tools') {
    const tools = [
      {
        name: 'get_time',
        description: 'Get current date and time',
        schema: { type: 'object', properties: {}, required: [] },
        endpoint: '/get_time',
        method: 'get'
      },
      {
        name: 'get_birthday',
        description: 'Get a birthday for a given name',
        schema: { 
          type: 'object', 
          properties: { 
            name: { type: 'string', description: 'The name to get birthday for' } 
          }, 
          required: ['name'] 
        },
        endpoint: '/get_birthday',
        method: 'get'
      }
    ];
    res.writeHead(200);
    res.end(JSON.stringify(tools, null, 2));
  } else if (parsedUrl.pathname === '/get_time') {
    const currentTime = {
      time: new Date().toISOString(),
      timestamp: Date.now()
    };
    res.writeHead(200);
    res.end(JSON.stringify(currentTime, null, 2));
  } else if (parsedUrl.pathname === '/get_birthday') {
    const name = parsedUrl.searchParams.get('name');
    if (!name) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Name parameter is required' }));
      return;
    }
    
    const randomTimestamp = Math.floor(Math.random() * 946684800);
    const randomDate = new Date(randomTimestamp * 1000);
    const birthday = randomDate.toISOString().split('T')[0];
    
    res.writeHead(200);
    res.end(JSON.stringify({ name, birthday }, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Example HTTP API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /tools - Get tool definitions');
  console.log('  GET /get_time - Get current time');
  console.log('  GET /get_birthday?name=John - Get birthday for a name');
});