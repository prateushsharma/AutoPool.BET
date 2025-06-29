// File: src/components/JoinGameModal.tsx (Updated)
// Updated to handle ANY network dynamically like Remix IDE

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getParticipationCost, joinCompetitionWithETH, ParticipationCost } from '../contracts/SepoliaParticipation';
import { 
 getDispatchParticipationCost, 
 joinDispatchCompetitionWithAVAX, 
 DispatchParticipationCost 
} from '../contracts/DispatchParticipation';
import { 
 generateUsername, 
 isCrossChainParticipation, 
 getParticipationContractType, 
 formatCurrency,
 getNativeCurrency,
 getBridgeProtocol,
 getBridgeTime,
 getBridgeFee
} from '../utils/networkUtils';
import './JoinGameModal.css';

interface JoinGameModalProps {
 isOpen: boolean;
 onClose: () => void;
 gameData: {
   id: string;
   title: string;
   startingBalance: number;
   currentParticipants: number;
   maxParticipants: number;
 };
 walletAddress: string;
 chainId: string;
 provider: ethers.providers.Provider;
 signer: ethers.Signer;
}

const JoinGameModal: React.FC<JoinGameModalProps> = ({
 isOpen,
 onClose,
 gameData,
 walletAddress,
 chainId,
 provider,
 signer
}) => {
 // Form state
 const [investmentAmount, setInvestmentAmount] = useState('0.1');
 const [confidence, setConfidence] = useState(75);
 const [strategy, setStrategy] = useState('');
 
 // Cost calculation state
 const [costData, setCostData] = useState<ParticipationCost | DispatchParticipationCost | null>(null);
 const [loadingCost, setLoadingCost] = useState(false);
 const [costError, setCostError] = useState<string | null>(null);
 
 // Transaction state
 const [isJoining, setIsJoining] = useState(false);
 const [joinError, setJoinError] = useState<string | null>(null);
 const [joinSuccess, setJoinSuccess] = useState(false);
 
 // User balance state
 const [userBalance, setUserBalance] = useState<string>('0');
 
 // Generate username
 const username = generateUsername(walletAddress, chainId);
 const participationType = getParticipationContractType(chainId);
 const isCrossChain = isCrossChainParticipation(chainId);
 
 // Get network info dynamically
 const nativeCurrency = getNativeCurrency(chainId);
 const bridgeProtocol = getBridgeProtocol(chainId);
 const bridgeTime = getBridgeTime(chainId);
 const bridgeFee = getBridgeFee(chainId);
 
 // Extract competition ID from game ID
 const extractCompetitionId = (gameId: string): number => {
   const parts = gameId.split('_');
   const timestamp = parts[1];
   return parseInt(timestamp.slice(-4));
 };
 
 const competitionId = extractCompetitionId(gameData.id);

 // Fetch user balance
 useEffect(() => {
   const fetchBalance = async () => {
     try {
       const balance = await provider.getBalance(walletAddress);
       setUserBalance(ethers.utils.formatEther(balance));
     } catch (error) {
       console.error('Error fetching balance:', error);
     }
   };
   
   if (isOpen && walletAddress && provider) {
     fetchBalance();
   }
 }, [isOpen, walletAddress, provider]);

 // Real-time cost calculation with DYNAMIC network support
 useEffect(() => {
   const calculateCost = async () => {
     if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
       setCostData(null);
       setCostError(null);
       return;
     }
     
     // Skip cost calculation for native Avalanche
     if (participationType === 'native') {
       setCostData(null);
       setCostError(null);
       return;
     }
     
     setLoadingCost(true);
     setCostError(null);
     
     try {
       let result;
       
       if (participationType === 'sepolia') {
         // CCIP cost calculation
         result = await getParticipationCost(provider, investmentAmount);
       } else if (participationType === 'dispatch') {
         // Teleporter cost calculation
         result = await getDispatchParticipationCost(provider, investmentAmount);
       } else {
         // FALLBACK: For any other network, simulate basic cost
         console.log(`⚠️ Unknown network ${chainId}, using fallback cost calculation`);
         const investmentWei = ethers.utils.parseEther(investmentAmount);
         const fallbackFee = ethers.utils.parseEther("0.001"); // 0.001 native token fee
         const totalCost = investmentWei.add(fallbackFee);
         
         result = {
           success: true,
           data: {
             totalCost: totalCost.toString(),
             teleporterFee: fallbackFee.toString(),
             actualParticipation: investmentWei.toString(),
             totalCostAvax: ethers.utils.formatEther(totalCost),
             teleporterFeeAvax: ethers.utils.formatEther(fallbackFee),
             actualParticipationAvax: ethers.utils.formatEther(investmentWei)
           }
         };
       }
       
       if (result.success && result.data) {
         setCostData(result.data);
       } else {
         setCostError(result.error || 'Failed to calculate cost');
         setCostData(null);
       }
     } catch (error: any) {
       setCostError(error.message);
       setCostData(null);
     } finally {
       setLoadingCost(false);
     }
   };
   
   // Debounce cost calculation
   const timer = setTimeout(calculateCost, 500);
   return () => clearTimeout(timer);
 }, [investmentAmount, provider, participationType, chainId]);

 // Check if user can afford participation
 const canAfford = () => {
   if (!costData || !userBalance) return false;
   
   // Handle different cost data structures
   let totalCostField;
   if (participationType === 'sepolia') {
     totalCostField = (costData as ParticipationCost).totalCostEth;
   } else {
     // For dispatch and fallback networks
     totalCostField = (costData as DispatchParticipationCost).totalCostAvax;
   }
   
   return parseFloat(userBalance) >= parseFloat(totalCostField);
 };

 // Validate form
 const isFormValid = () => {
   return (
     investmentAmount &&
     parseFloat(investmentAmount) > 0 &&
     confidence >= 1 &&
     confidence <= 100 &&
     strategy.trim().length > 0 &&
     (participationType === 'native' || canAfford())
   );
 };

 // UNIVERSAL join competition handler
 const handleJoinCompetition = async () => {
   if (!isFormValid()) {
     setJoinError('Please fill all required fields correctly');
     return;
   }
   
   setIsJoining(true);
   setJoinError(null);
   setJoinSuccess(false);
   
   try {
     console.log('=== STARTING UNIVERSAL JOIN COMPETITION FLOW ===');
     console.log('Chain ID:', chainId);
     console.log('Participation Type:', participationType);
     
     // Step 1: Join competition on blockchain
     console.log(`Step 1: ${participationType} blockchain transaction...`);
     
     let blockchainResult;
     
     if (participationType === 'sepolia') {
       // Cross-chain participation via Sepolia CCIP
       blockchainResult = await joinCompetitionWithETH(signer, {
         competitionId: competitionId,
         confidence: confidence,
         investmentEth: investmentAmount
       });
     } else if (participationType === 'dispatch') {
       // Cross-chain participation via Dispatch Teleporter
       blockchainResult = await joinDispatchCompetitionWithAVAX(signer, {
         competitionId: competitionId,
         confidence: confidence,
         investmentAvax: investmentAmount
       });
     } else if (participationType === 'native') {
       // Native Avalanche participation (to be implemented)
       throw new Error('Native Avalanche participation not yet implemented in this modal');
     } else {
       // FALLBACK: For any other network, show as unsupported but don't crash
       throw new Error(`Network ${chainId} participation is not yet implemented. Currently supported: Sepolia (CCIP), Dispatch (Teleporter), Avalanche Fuji (Native)`);
     }
     
     if (!blockchainResult.success) {
       throw new Error(blockchainResult.error || 'Blockchain transaction failed');
     }
     
     console.log('✅ Blockchain transaction successful:', blockchainResult.txHash);
     
     // Show special message for different transaction types
     if (blockchainResult.data?.isFakeTransaction) {
       console.log('🎭 FAKE TRANSACTION - Demo purposes only');
     } else if (blockchainResult.data?.isRealTransaction) {
       console.log('🚀 REAL TRANSACTION - Live on blockchain');
     }
     
     // Step 2: Register with trading agent API
     console.log('Step 2: Trading agent registration...');
     
     const apiResponse = await fetch('http://localhost:5000/api/game/join-round', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         roundId: gameData.id,
         walletAddress: walletAddress,
         strategy: strategy.trim(),
         username: username
       })
     });
     
     const apiResult = await apiResponse.json();
     
     if (!apiResult.success) {
       console.warn('⚠️ API registration failed:', apiResult.error);
       // Continue anyway since blockchain transaction succeeded
     } else {
       console.log('✅ Trading agent registration successful');
     }
     
     // Success!
     setJoinSuccess(true);
     console.log('🎉 JOIN COMPETITION COMPLETED SUCCESSFULLY');
     
     // Close modal after 2 seconds
     setTimeout(() => {
       onClose();
       // Refresh page to show updated game state
       window.location.reload();
     }, 2000);
     
   } catch (error: any) {
     console.error('❌ Join competition failed:', error);
     setJoinError(error.message || 'Failed to join competition');
   } finally {
     setIsJoining(false);
   }
 };

 if (!isOpen) return null;

 return (
   <div className="join-modal-overlay" onClick={onClose}>
     <div className="join-modal" onClick={(e) => e.stopPropagation()}>
       <div className="modal-header">
         <h3>🎮 Join Competition</h3>
         <button className="close-btn" onClick={onClose}>×</button>
       </div>
       
       {/* Game Info */}
       <div className="game-info-section">
         <div className="game-info-item">
           <span className="label">Game:</span>
           <span className="value">{gameData.title}</span>
         </div>
         <div className="game-info-item">
           <span className="label">Participants:</span>
           <span className="value">{gameData.currentParticipants}/{gameData.maxParticipants}</span>
         </div>
         <div className="game-info-item">
           <span className="label">Username:</span>
           <span className="value mono">{username}</span>
         </div>
         <div className="game-info-item">
           <span className="label">Network:</span>
           <span className="value">
             {isCrossChain ? `🔗 ${bridgeProtocol} (${bridgeTime})` : '🏠 Native'}
           </span>
         </div>
         <div className="game-info-item">
           <span className="label">Chain ID:</span>
           <span className="value mono">{chainId}</span>
         </div>
       </div>

       {/* Form */}
       <div className="join-form">
         {/* Investment Amount */}
         <div className="form-group">
           <label>Investment Amount ({nativeCurrency})</label>
           <input
             type="number"
             value={investmentAmount}
             onChange={(e) => setInvestmentAmount(e.target.value)}
             className="form-input"
             placeholder="0.1"
             min="0"
             step="0.001"
           />
           <div className="balance-info">
             Balance: {formatCurrency(userBalance, nativeCurrency)}
           </div>
         </div>

         {/* Cost Breakdown (Cross-chain only) */}
         {participationType !== 'native' && (
           <div className="cost-breakdown">
             <h4>💰 Cost Breakdown ({bridgeProtocol})</h4>
             {loadingCost ? (
               <div className="loading-cost">Calculating...</div>
             ) : costError ? (
               <div className="cost-error">❌ {costError}</div>
             ) : costData ? (
               <div className="cost-details">
                 <div className="cost-item">
                   <span>Investment:</span>
                   <span>
                     {participationType === 'sepolia' 
                       ? formatCurrency((costData as ParticipationCost).actualParticipationEth, 'ETH')
                       : formatCurrency((costData as DispatchParticipationCost).actualParticipationAvax, nativeCurrency)
                     }
                   </span>
                 </div>
                 <div className="cost-item">
                   <span>{bridgeProtocol} Fee:</span>
                   <span>
                     {participationType === 'sepolia' 
                       ? formatCurrency((costData as ParticipationCost).ccipFeeEth, 'ETH')
                       : formatCurrency((costData as DispatchParticipationCost).teleporterFeeAvax, nativeCurrency)
                     }
                   </span>
                 </div>
                 <div className="cost-item total">
                   <span><strong>Total Required:</strong></span>
                   <span>
                     <strong>
                       {participationType === 'sepolia' 
                         ? formatCurrency((costData as ParticipationCost).totalCostEth, 'ETH')
                         : formatCurrency((costData as DispatchParticipationCost).totalCostAvax, nativeCurrency)
                       }
                     </strong>
                   </span>
                 </div>
                 <div className="bridge-info">
                   ⚡ {bridgeTime} • {bridgeFee}
                   {participationType === 'dispatch' && (
                     <span className="real-badge"> • 🚀 REAL</span>
                   )}
                   {participationType !== 'sepolia' && participationType !== 'dispatch' && (
                     <span className="demo-badge"> • 🔧 EXPERIMENTAL</span>
                   )}
                 </div>
                 {!canAfford() &&  (
                   <div className="insufficient-balance">
                     ⚠️ Insufficient balance
                   </div>
                 )}
               </div>
             ) : null}
           </div>
         )}

         {/* Show network support status */}
         {participationType === 'unsupported' && (
           <div className="network-warning">
             <h4>⚠️ Experimental Network</h4>
             <p>Chain ID <code>{chainId}</code> is not fully supported yet. Participation may not work as expected.</p>
             <p><strong>Supported Networks:</strong> Sepolia (CCIP), Dispatch (Teleporter), Avalanche Fuji (Native)</p>
           </div>
         )}

         {/* Confidence Slider */}
         <div className="form-group">
           <label>Confidence Level: {confidence}%</label>
           <input
             type="range"
             min="1"
             max="100"
             value={confidence}
             onChange={(e) => setConfidence(parseInt(e.target.value))}
             className="form-slider"
           />
           <div className="slider-labels">
             <span>1%</span>
             <span>50%</span>
             <span>100%</span>
           </div>
         </div>

         {/* Strategy */}
         <div className="form-group">
           <label>Trading Strategy</label>
           <textarea
             value={strategy}
             onChange={(e) => setStrategy(e.target.value)}
             className="form-textarea"
             placeholder="Describe your trading strategy (e.g., Buy ETH when volume spikes 20%, sell at 5% profit or 2% loss)"
             rows={3}
           />
           <div className="form-hint">
             This strategy will be evaluated by AI and used for automated trading
           </div>
         </div>

         {/* Error Display */}
         {joinError && (
           <div className="error-message">
             ❌ {joinError}
           </div>
         )}

         {/* Success Display */}
         {joinSuccess && (
           <div className="success-message">
             🎉 Successfully joined competition! Redirecting...
           </div>
         )}

         {/* Action Buttons */}
         <div className="form-actions">
           <button 
             className="cancel-btn" 
             onClick={onClose}
             disabled={isJoining}
           >
             Cancel
           </button>
           <button 
             className="join-btn" 
             onClick={handleJoinCompetition}
             disabled={!isFormValid() || isJoining || joinSuccess}
           >
             {isJoining ? (
               `🔄 Joining via ${bridgeProtocol}...`
             ) : participationType === 'sepolia' ? (
               `🚀 Join (${costData ? formatCurrency((costData as ParticipationCost).totalCostEth, 'ETH') : '...'} total)`
             ) : participationType === 'dispatch' ? (
               `🚀 Join REAL (${costData ? formatCurrency((costData as DispatchParticipationCost).totalCostAvax, nativeCurrency) : '...'} total)`
             ) : participationType === 'unsupported' ? (
               `🔧 Try Experimental Join`
             ) : (
               '🎮 Join Competition'
             )}
           </button>
         </div>
       </div>
     </div>
   </div>
 );
};

export default JoinGameModal;