const http = require('http')
const fs = require('fs')

const locks = new Set()
const server = http.createServer()
  .on('request', (req, res) => {
    console.log(`${req.method} ${req.url}`)
    Object.entries(req.headers).forEach(([k, v]) => console.log(`- ${k}: ${v}`))
    console.log('')

    const path = `${__dirname}/../../scratch/remote/.git${req.url}`

    switch (req.method) {
      case 'GET':
      case 'HEAD':
        try {
          res.write(fs.readFileSync((path === '/') ? '/HEAD' : path))
        } catch (err) {
          switch (err.code) {
            case 'ENOENT':
              res.statusCode = 404
              break

            case 'EISDIR':
              res.statusCode = 200
              break

            default:
              res.statusCode = 500
          }
          console.log(err)
        } finally {
          console.log('\n====\n')
          res.end()
        }
        break

      case 'LOCK':
        req
          .on('data', chunk => console.log(chunk.toString('utf8')))
          .once('end', () => {
            if (locks.has(path)) {
              console.log(`${path} is already locked!`)
              res.statusCode = 423
            } else {
              locks.add(path)

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
            }
            res.end()
            console.log('\n====\n')
          })
        break

      case 'MKCOL':
        try {
          const stat = fs.statSync(path)
          console.log(`${path} already exists`, stat)
          res.statusCode = 405
        } catch (err) {
          console.log(err)
          switch (err.code) {
            case 'ENOENT':
              try {
                fs.mkdirSync(path)
              } catch (err) {
                console.log(err)
                res.statusCode = 500
              }
              break

            default:
              res.statusCode = 500
          }
        } finally {
          res.end()
          console.log('\n====\n')
        }
        break

      case 'MOVE':
        console.log(`moving ${path} to ${__dirname}/../../scratch/remote/.git/${req.headers.destination.slice(21)}`)
        fs.renameSync(path, `${__dirname}/../../scratch/remote/.git/${req.headers.destination.slice(21)}`)
        res.end()
        console.log('\n====\n')
        break

      case 'PUT':
        const chunks = []
        req
          .on('data', chunk => chunks.push(chunk))
          .once('end', () => {
            fs.writeFileSync(path, Buffer.concat(chunks))
            res.end()
            console.log('\n====\n')
          })
        break

      case 'PROPFIND':
        req
          .on('data', chunk => console.log(chunk.toString('utf8')))
          .once('end', () => {
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
</D:multistatus>`

            res.statusCode = 207
            res.setHeader('content-type', 'text/xml')
            res.setHeader('content-length', data.length)
            res.write(data)
            res.end()
            console.log('\n====\n')
          })
        break

      case 'UNLOCK':
        req
          .on('data', chunk => console.log(chunk.toString('utf8')))
          .once('end', () => {
            locks.delete(path)
            res.statusCode = 204
            res.end()
            console.log('\n====\n')
          })
        break

      default:
        res.statusCode = 500
        res.end()
    }
  })
  .once('listening', () => console.log('listening'))
  .listen(8080)
