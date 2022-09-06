#!/bin/bash
DIR="./test/files/keys"
ORGIN_DIR=`pwd`

mkdir -p $DIR
cd $DIR

FILENAME="jwtRS256"

if ! [ -f "${FILENAME}.key" ]; then
    ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}.key"  #> /dev/null
    ssh-keygen -e -m PEM -f "${FILENAME}.key" > "${FILENAME}.key.pub"
fi

if ! [ -f "${FILENAME}-invalid.key" ]; then
    ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}-invalid.key"
    rm "${FILENAME}-invalid.key.pub"
fi

cd $ORGIN_DIR