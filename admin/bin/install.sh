#!/bin/sh

if [ "$#" -ne 1 ] && [ "$#" -ne 2 ]; then
  echo "Usage: $0 DOMAIN [BASEDIR]" >&2
  exit 1
fi

DOMAIN=$1

# Get absolute path of admin top directory
ADMINDIR=$(cd "$(dirname $(dirname "$0"))"; pwd)
BASEDIR=$ADMINDIR

# If supplied as an argument, replace BASEDIR
if [ "$#" -eq 2 ]; then
	BASEDIR=$2
fi

# Create admin directories
mkdir -p $BASEDIR/log/$DOMAIN
mkdir -p $BASEDIR/etc/$DOMAIN
mkdir -p $BASEDIR/var/$DOMAIN/runtime

# Create default configuration (replace tokens)
SED_DOMAIN="s/\${DOMAIN}/$DOMAIN/g"
ESCAPED_BASEDIR=${BASEDIR//\//\\\/}
SED_BASEDIR="s/\${BASEDIR}/$ESCAPED_BASEDIR/g"
sed "$SED_DOMAIN" $ADMINDIR/etc/default/config.json | sed "$SED_BASEDIR" > $BASEDIR/etc/$DOMAIN/config.json
