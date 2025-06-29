export const PRIZE_ORACLE = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalDistributed",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "CompetitionSettled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "protocolFeeRate",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "creatorBonusRate",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "minScoreThreshold",
				"type": "uint256"
			}
		],
		"name": "ConfigurationUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalPrizePool",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "winnerCount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "PrizesCalculated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "participantCount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ScoresSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorizedCallers",
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
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPool",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "creatorAddress",
				"type": "address"
			}
		],
		"name": "calculatePrizeDistribution",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "participants",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "rewards",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "competitionParticipants",
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
		"name": "creatorBonusRate",
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
		"name": "getOracleConfig",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_protocolFeeRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_creatorBonusRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_minScoreThreshold",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getOracleStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "operational",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "totalCompetitions",
				"type": "uint256"
			},
			{
				"internalType": "uint256[3]",
				"name": "currentConfig",
				"type": "uint256[3]"
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
				"internalType": "address",
				"name": "participant",
				"type": "address"
			}
		],
		"name": "getParticipantReward",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isOperational",
		"outputs": [
			{
				"internalType": "bool",
				"name": "operational",
				"type": "bool"
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
			}
		],
		"name": "isReadyForSettlement",
		"outputs": [
			{
				"internalType": "bool",
				"name": "ready",
				"type": "bool"
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
				"name": "totalDistributed",
				"type": "uint256"
			}
		],
		"name": "markAsSettled",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minScoreThreshold",
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
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
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
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "prizeDistributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "participant",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "finalScore",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "rewardAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "distributed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "protocolFeeRate",
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
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "scoresSubmitted",
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
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "authorized",
				"type": "bool"
			}
		],
		"name": "setAuthorizedCaller",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "settlements",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "competitionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPool",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "participantCount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "protocolFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "creatorBonus",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "settled",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "settlementTimestamp",
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
				"internalType": "address[]",
				"name": "participants",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "scores",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "investments",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "confidenceScores",
				"type": "uint256[]"
			}
		],
		"name": "submitScores",
		"outputs": [],
		"stateMutability": "nonpayable",
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
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_protocolFeeRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_creatorBonusRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_minScoreThreshold",
				"type": "uint256"
			}
		],
		"name": "updateConfiguration",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]