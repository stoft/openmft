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

# Create agent directories
mkdir -p $BASEDIR/log/$AGENTID
mkdir -p $BASEDIR/etc/$AGENTID
mkdir -p $BASEDIR/var/$AGENTID/runtime
mkdir -p $BASEDIR/var/$AGENTID/inbound
mkdir -p $BASEDIR/var/$AGENTID/outbound

# Create default configuration (replace tokens)
SED_AGENTID="s/\${AGENTID}/$AGENTID/g"
ESCAPED_BASEDIR=${BASEDIR//\//\\\/}
SED_BASEDIR="s/\${BASEDIR}/$ESCAPED_BASEDIR/g"
sed "$SED_AGENTID" $AGENTDIR/etc/default/config.json | sed "$SED_BASEDIR" > $BASEDIR/etc/$AGENTID/config.json
