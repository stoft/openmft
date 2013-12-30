#!/bin/sh

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 (DOMAIN | BASEDIR)" >&2
  exit 1
fi

# Get absolute path of admin top directory
ADMINDIR=$(cd "$(dirname $(dirname "$0"))"; pwd)
DEFAULTCONFIG="$ADMINDIR/etc/$1"
CUSTOMCONFIG="$BASEDIR"

if [ -f "$DEFAULTCONFIG/config.json" ]; then
	pushd $ADMINDIR/src > /dev/null
	make start "$DEFAULTCONFIG"
	popd > /dev/null
	#node "$ADMINDIR/src/agent.js" "$DEFAULTCONFIG"
elif [ -f "$CUSTOMCONFIG/config.json" ]; then
	node "$ADMINDIR/src/agent.js" "$CUSTOMCONFIG"
else
	echo "Could not find $DEFAULTCONFIG/config.json"
	echo "Could not find $CUSTOMCONFIG/config.json"
	echo "Aborting start"
	exit 1
fi
