#!/bin/bash

# To generate the keypair, run 'bash bin/generate.sh' in the main folder
# The requested fields can be left empty, except for the 'common name'
# The common name has to correspond to the hostname (e.g. localhost)

echo """
ATTENTION: it is important you specify a common name.
E.g. if you set the common name to 'localhost', then you can connect to the server with the url https://localhost:<port>
"""

openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
