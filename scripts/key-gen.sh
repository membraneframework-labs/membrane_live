#!/bin/sh
DIR="./test/files/keys"
ORGIN_DIR=`pwd`

mkdir -p $DIR
cd $DIR

FILENAME="jwtRS256"

if ! [ -f "${FILENAME}.key" ] && \
    ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}.key"  1> /dev/null && \
    ssh-keygen -e -m PEM -f "${FILENAME}.key" > "${FILENAME}.key.pub"; then

        echo "JWT for tests was generated successfully"
fi

if ! [ -f "${FILENAME}-invalid.key" ] && \
    ssh-keygen -t rsa -P "" -b 4096 -m PEM -f "${FILENAME}-invalid.key" 1> /dev/null && \
    rm "${FILENAME}-invalid.key.pub" ; then
        
        echo "Invalid JWT for tests was generated successfully"
fi

cd $ORGIN_DIR