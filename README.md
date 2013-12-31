# openmft

A simpler and better way to manage file transfers for enterprises

## Objects

### Notification
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

### Agent

Property | Type | Description | C | R | U | D
--- | --- | --- | --- | --- | --- | ---
id | int | Unique identifier set by the administrator upon agent first discovery | | M | M | M
version | int | The current resource version (maintained by Administrator). Used to keep track of and verify that changes has been propagated properly | | | M |
name | string | Human-friendly name of agent (unique per host) | M | | O |
host | string | Name of host (or DNS-alias) for the agent | M | | O |
port | int | TCP port that the agent listens to | M | | O |
inboundDir | string | Root directory that the agent monitors for inbound files (from external source to the MFT network) | M | | O |
outboundDir | string | Root directory where the agent puts outbound files (from the MFT network to an external source) | M | | O |

### Transfer

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

### Administrator

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
