export const DISPATCH_PARTICIPATION_ABI=[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_teleporterMessenger",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_avalancheBridgeContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "InsufficientAVAXAmount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidBridgeContract",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidConfidence",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "MessageAlreadyProcessed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "MessageSendFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "OnlyOwner",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "UnauthorizedTeleporterMessage",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "newBridge",
				"type": "address"
			}
		],
		"name": "BridgeContractUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "participant",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "avaxAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betmainAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "confidence",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "messageId",
				"type": "bytes32"
			}
		],
		"name": "CrossChainParticipationSent",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "messageId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sourceAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "message",
				"type": "bytes"
			}
		],
		"name": "TeleporterMessageReceived",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "AVALANCHE_FUJI_BLOCKCHAIN_ID",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "AVAX_TO_BETMAIN_RATE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "avalancheBridgeContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "emergencyWithdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getBridgeAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCommonTeleporterAddresses",
		"outputs": [
			{
				"internalType": "address[3]",
				"name": "",
				"type": "address[3]"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "avaxAmount",
				"type": "uint256"
			}
		],
		"name": "getParticipationCost",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalCost",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "teleporterFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "actualParticipation",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getSourceChainName",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_totalParticipations",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_totalAvaxSent",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_contractBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "confidence",
				"type": "uint256"
			}
		],
		"name": "joinCompetitionWithAVAX",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minimumAvaxAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "processedMessages",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "sourceBlockchainID",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "originSenderAddress",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "message",
				"type": "bytes"
			}
		],
		"name": "receiveTeleporterMessage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teleporterGasLimit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teleporterMessenger",
		"outputs": [
			{
				"internalType": "contract ITeleporterMessenger",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalAvaxSent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalParticipations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newBridge",
				"type": "address"
			}
		],
		"name": "updateBridgeContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userParticipations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
] as const;