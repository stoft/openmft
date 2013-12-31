# OpenMFT

A simpler way to manage file transfers for enterprises

## Table of Contents

* [Install and start](#install-and-start)
* [Resources](#resources)
  * [Notification](#notification-resource)
  * [Agent](#agent-resource)
  * [Transfer](#transfer-resource)
* [Interfaces](#interfaces)
  * [Administrator](#administrator-interface)

## Install and start

### Download software

> git clone git@github.com:stoft/openmft.git

### Administrator

#### Install

> $OPENMFT_HOME/admin/bin/install.sh _DOMAIN_

#### Configure

Optionally modify configuration parameters to your liking:
> $OPENMFT_HOME/admin/etc/_DOMAIN_/config.json

```json
{
	"configVersion": 0.1,
	"domain": "${DOMAIN}",
	"host": "localhost",
	"port": 3300,
	"logDir": "${BASEDIR}/log/${DOMAIN}",
	"configDir": "${BASEDIR}/etc/${DOMAIN}",
	"runtimeDir": "${BASEDIR}/var/${DOMAIN}/runtime"
}
```

> $OPENMFT_HOME/admin/bin/install.sh _DOMAIN_

#### Start

> $OPENMFT_HOME/admin/bin/start.sh _DOMAIN_

### Agent

#### Install

> $OPENMFT_HOME/agent/bin/install.sh _AGENTNAME_

#### Configure

Optionally modify configuration parameters to your liking:
> $OPENMFT_HOME/agent/etc/_AGENTNAME_/config.json

```json
{
	"configVersion": 0.1,
	"name": "${AGENTNAME}",
	"host": "localhost",
	"port": 3301,
	"adminHost": "localhost",
	"adminPort": 3300,
	"logDir": "${BASEDIR}/log/${AGENTNAME}",
	"configDir": "${BASEDIR}/etc/${AGENTNAME}",
	"runtimeDir": "${BASEDIR}/var/${AGENTNAME}/runtime",
	"inboundDir": "${BASEDIR}/var/${AGENTNAME}/inbound",
	"outboundDir": "${BASEDIR}/var/${AGENTNAME}/outbound",
	"triggers" : []
}
```

#### Start

> $OPENMFT_HOME/agent/bin/start.sh _agent_name_


## Resources

### Notification Resource
A notification is defined as:
```json
{ 
    "filename" : "<path>",
    "id" : "<notificationId>",
	"source" : "<sourceId>",
	"target" : "<targetId>",
	"fileId": "fileId",
	"transfer": "transferId" 
}
```

### Agent Resource

Property | Type | Description | C | R | U | D
--- | --- | --- | --- | --- | --- | ---
id | int | Unique identifier set by the administrator upon agent first discovery | | M | M | M
version | int | The current resource version (maintained by Administrator). Used to keep track of and verify that changes has been propagated properly | | | M |
name | string | Human-friendly name of agent (unique per host) | M | | O |
host | string | Name of host (or DNS-alias) for the agent | M | | O |
port | int | TCP port that the agent listens to | M | | O |
inboundDir | string | Root directory that the agent monitors for inbound files (from external source to the MFT network) | M | | O |
outboundDir | string | Root directory where the agent puts outbound files (from the MFT network to an external source) | M | | O |

### Transfer Resource

Property | Type | Description | C | R | U | D
--- | --- | --- | --- | --- | --- | ---
id | int | Unique identifier set by the administrator upon transfer creation | | M | M | M
version | int | The current resource version (maintained by Administrator). Used to keep track of and verify that changes has been propagated properly | | | M |
name | string | Human-friendly name of transfer = message type = directory name for inbound/outbound files | M | | O |
sources | list of transfer sources | Agents that the transfer may originate from | M | | O |
targets | list of transfer targets | Agents that the transfer will target | M | | O |

#### Transfer Source
Property | Type | Description | C | R | U | D
--- | --- | --- | --- | --- | --- | ---
agentId | int | Unique identifier for the source agent | M | M | M | M

#### Transfer Target
Property | Type | Description | C | R | U | D
--- | --- | --- | --- | --- | --- | ---
agentId | int | Unique identifier for the target agent | M | M | M | M



## Interfaces

### HTTP Status Codes Used

When | Status Code
--- | ---
Request was processed as expected | 200 (OK)
Request was incorrect (invalid data or url) | 400 (Bad Request)
Resource was not found | 404 (Not Found)
Request was correct but an error occurred while processing | 500 (Internal Server Error)

### Administrator Interface

Path | Verb | Description | Parameters | Request | Response
--- | --- | --- | --- | --- | ---
/rest/v1/agents | GET | List agents | offset, limit | N/A | list of agents
/rest/v1/agents | POST | Create agent | | agent (partial) | agent
/rest/v1/agents/:id | GET | Get agent details | id | N/A | agent
/rest/v1/agents/:id | PUT | Update agent details | id | agent (partial) | agent
/rest/v1/agents/:id | DELETE | Delete agent | id | N/A | N/A
/rest/v1/transfers | GET | List transfers | offset, limit | N/A | list of transfers
/rest/v1/transfers | POST | Create transfer | | transfer (partial) | transfer
/rest/v1/transfers/:id | GET | Get transfer details | id | N/A | transfer
/rest/v1/transfers/:id | PUT | Update transfer details | id | transfer (partial) | transfer
/rest/v1/transfers/:id | DELETE | Delete transfer | id | N/A | N/A
