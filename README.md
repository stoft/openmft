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

Property | Type | Description
--- | --- | ---
id | int | Unique identifier set by the administrator upon agent first discovery
version | int | The current resource version (maintained by Administrator). Used to keep track of and verify that changes has been propagated properly
name | string | Human-friendly name of agent (not necessarily unique)
host | string | Name of host (or DNS-alias) for the agent
port | int | TCP port that the agent listens to
inboundDir | string | Root directory that the agent monitors for inbound files (from external source to the MFT network)
outboundDir | string | Root directory where the agent puts outbound files (from the MFT network to an external source)

### Transfer

Property | Type | Description
--- | --- | ---
id | int | Unique identifier set by the administrator upon transfer creation
version | int | The current resource version (maintained by Administrator). Used to keep track of and verify that changes has been propagated properly
name | string | Human-friendly name of transfer = message type = directory name for inbound/outbound files
sources | list of transfer sources | Agents that the transfer may originate from
targets | list of transfer targets | Agents that the transfer will target

#### Transfer Source
Property | Type | Description
--- | --- | ---
agentId | int | Unique identifier for the source agent

#### Transfer Target
Property | Type | Description
--- | --- | ---
agentId | int | Unique identifier for the target agent



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
