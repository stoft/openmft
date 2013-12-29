#!/bin/sh

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 (AGENTID | BASEDIR)" >&2
  exit 1
fi

# Get absolute path of agent top directory
AGENTDIR=$(cd "$(dirname $(dirname "$0"))"; pwd)
DEFAULTCONFIG="$AGENTDIR/etc/$1"
CUSTOMCONFIG="$BASEDIR"

if [ -f "$DEFAULTCONFIG/config.json" ]; then
	node "$AGENTDIR/src/agent.js" "$DEFAULTCONFIG"
elif [ -f "$CUSTOMCONFIG/config.json" ]; then
	node "$AGENTDIR/src/agent.js" "$CUSTOMCONFIG"
else
	echo "Could not find $DEFAULTCONFIG/config.json"
	echo "Could not find $CUSTOMCONFIG/config.json"
	echo "Aborting start"
	exit 1
fi
