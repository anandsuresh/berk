import fetch from 'node-fetch'
import http from 'http'
import fs from 'fs'
import { createActor } from '../declarations/berk/index.js';

const berk = createActor(process.argv[2], {
  agentOptions: {
    fetch,
    host: 'http://localhost:8000'
  }
});

const server = http.createServer()
  .on('request', onRequest)
  .once('listening', () => console.log('listening'))
  .listen(8080)


function handleError(err, req, res) {
  res.statusCode = 500
  res.end()
  console.log('error', err)
  console.log('====\n')
}

function onRequest(req, res) {
  console.log(`${req.method} ${req.url}`)
  Object.entries(req.headers).forEach(([k, v]) => console.log(`- ${k}: ${v}`))
  console.log('')

  // GET /
  if (req.method === 'GET' && req.url === '/') {
    getHead(req, res)

  // GET /info/refs
  // HEAD /info/refs
  } else if ((req.method === 'GET' || req.method === 'HEAD') && req.url === '/info/refs') {
    getRefs(req, res)

  // PUT /refs/*/*
  } else if (req.method === 'PUT' && req.url.match(/^\/refs\/[a-z0-9]+\/[a-z0-9]+$/)) {
    putRef(req, res)

  // GET /HEAD
  } else if (req.method === 'GET' && req.url === '/HEAD') {
    getHead(req, res)

  // PROPFIND /
  } else if (req.method === 'PROPFIND') {
    propfind(req, res)

  // LOCK *
  } else if (req.method === 'LOCK') {
    lock(req, res)

  // UNLOCK *
  } else if (req.method === 'UNLOCK') {
    unlock(req, res)

  // MKCOL *
  } else if (req.method === 'MKCOL') {
    // Will be hard-coded in the canister
    res.statusCode = 200
    res.end()
    console.log('====\n')

  // GET /objects/info/packs
  // HEAD /objects/info/packs
  // GET /objects/info/http-alternates
  // HEAD /objects/info/http-alternates
} else if ((req.method === 'GET' || req.method === 'HEAD') && (req.url === '/objects/info/packs' || req.url === '/objects/info/http-alternates')) {
    getInfoPacks(req, res)

  // GET /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // GET /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  } else if ((req.method === 'GET') && (req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{38}/) || req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{62}/))) {
    getObject(req, res)

  // PUT /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // PUT /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  } else if ((req.method === 'PUT') && (req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{38}/) || req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{62}/))) {
    putObject(req, res)

  // MOVE /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // MOVE /objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  } else if ((req.method === 'MOVE') && (req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{38}/) || req.url.match(/\/objects\/[a-z0-9]{2}\/[a-z0-9]{62}/))) {
    moveObject(req, res)

  // Fail
  } else {
    res.statusCode = 500
    res.end()
    process.exit(1)
  }
}


function getHead(req, res) {
  berk.getHead()
    .then(result => {
      res.write(result)
      res.end()
      console.log('====\n')
    })
    .catch(err => handleError(err, req, res))
}


function getRefs(req, res) {
  berk.getRefs()
    .then(result => {
      console.log(result)
      res.write(result)
      res.end()
      console.log('====\n')
    })
    .catch(err => handleError(err, req, res))
}

function putRef(req, res) {
  const chunks = []
  req
    .on('data', chunk => chunks.push(chunk))
    .once('end', () => {
      const value = Buffer.concat(chunks).toString('utf8').trim()

      console.log(value)
      console.log('====\n')

      berk.putRef(req.url.slice(1), value)
        .then(() => res.end())
        .catch(err => handleError(err, req, res))
    })
}


function getInfoPacks(req, res) {
  berk.getInfoPacks()
    .then(result => {
      res.write(result)
      res.end()
      console.log('====\n')
    })
    .catch(err => handleError(err, req, res))
}

function getObject(req, res) {
  const id = req.url
    .replace(/\//g, '')
    .replace('objects', '')

  berk.getObject(id)
    .then(([result]) => {
      if (result.length) {
        res.write(Buffer.from(result))
      } else {
        res.statusCode = 404
      }
      res.end()
      console.log('====\n')
    })
    .catch(err => handleError(err, req, res))
}

function putObject(req, res) {
  const id = req.url
    .replace(/\//g, '')
    .replace('objects', '')

  const chunks = []
  req
    .on('data', chunk => chunks.push(chunk))
    .once('end', () => {
      const data = [...Buffer.concat(chunks)]

      berk.putObject(id, data)
        .then(() => {
          res.end()
        })
        .catch(err => handleError(err, req, res))
    })
  console.log('====\n')
}

function moveObject(req, res) {
  const src = req.url
    .replace(/\//g, '')
    .replace('objects', '')
  const dest = req.headers.destination.slice(21)
    .replace(/\//g, '')
    .replace('objects', '')

  berk.moveObject(src, dest)
    .then(() => {
      res.end()
    })
    .catch(err => handleError(err, req, res))
  console.log('====\n')
}


function lock(req, res) {
  berk.lock(req.url)
    .then(locked => {
      if (locked) {
        const data = `<?xml version="1.0" encoding="utf-8" ?>
          <D:prop xmlns:D="DAV:">
            <D:lockdiscovery>
              <D:activelock>
                <D:locktype><D:write/></D:locktype>
                <D:lockscope><D:exclusive/></D:lockscope>
                <D:depth>Infinity</D:depth>
                <D:owner>
                  <D:href>mailto:anand.suresh@dfinity.org</D:href>
                </D:owner>
                <D:timeout>Second-604800</D:timeout>
                <D:locktoken>
                  <D:href>opaquelocktoken:e71d4fae-5dec-22d6-fea5-00a0c91e6be4</D:href>
                </D:locktoken>
              </D:activelock>
            </D:lockdiscovery>
          </D:prop>`
        res.setHeader('content-type', 'text/xml')
        res.setHeader('content-length', data.length)
        res.write(data)
      } else {
        res.statusCode = 423
      }

      res.end()
      console.log('====\n')
    })
    .catch(err => handleError(err, req, res))
}

function unlock(req, res) {
  const chunks = []
  req
    .on('data', chunk => chunks.push(chunk))
    .once('end', () => {
      const data = Buffer.concat(chunks)
      console.log(data.toString('utf8'))
      res.statusCode = 204
      res.end()
      console.log('====\n')
    })
}


function propfind(req, res) {
  const data = `<?xml version="1.0" encoding="utf-8" ?>
    <D:multistatus xmlns:D="DAV:">
    <D:response>
    <D:href>http://localhost:8080/</D:href>
    <D:propstat>
      <D:prop>
        <D:supportedlock>
          <D:lockentry>
            <D:lockscope><D:exclusive/></D:lockscope>
            <D:locktype><D:write/></D:locktype>
          </D:lockentry>
          <D:lockentry>
            <D:lockscope><D:shared/></D:lockscope>
            <D:locktype><D:write/></D:locktype>
          </D:lockentry>
        </D:supportedlock>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
    </D:response>
    </D:multistatus>
  `

  res.statusCode = 207
  res.setHeader('content-type', 'text/xml')
  res.setHeader('content-length', data.length)
  res.write(data)
  res.end()
  console.log('====\n')
}
