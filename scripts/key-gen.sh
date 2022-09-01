#!/bin/sh
DIR="./test/files/keys"
ORGIN_DIR=`pwd`

mkdir -p $DIR
cd $DIR

FILENAME="jwtRS256"

ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}.key"
ssh-keygen -e -m PEM -f "${FILENAME}.key" > "${FILENAME}.key.pub"
ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}-invalid.key"
rm "${FILENAME}-invalid.key.pub"

cd $ORGIN_DIR