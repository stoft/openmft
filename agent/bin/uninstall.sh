#!/bin/sh

if [ "$#" -ne 1 ] && [ "$#" -ne 2 ]; then
  echo "Usage: $0 AGENTID [BASEDIR]" >&2
  exit 1
fi

AGENTID=$1

# Get absolute path of agent top directory
AGENTDIR=$(cd "$(dirname $(dirname "$0"))"; pwd)
BASEDIR=$AGENTDIR

# If supplied as an argument, replace BASEDIR
if [ "$#" -eq 2 ]; then
	BASEDIR=$2
fi

# Delete agent directories
rm -rf $BASEDIR/log/$AGENTID
rm -rf $BASEDIR/etc/$AGENTID
rm -rf $BASEDIR/var/$AGENTID
