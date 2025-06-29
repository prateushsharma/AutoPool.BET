// FILE: src/components/CreateCompetition.tsx
// PLACE: Create this file in src/components/ directory

import React, { useState } from 'react';
import { Plus, Clock, DollarSign, Target, Lightbulb, AlertCircle } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { useWallet } from '../contexts/WalletContext';

interface FormData {
  topic: string;
  minInvestment: string;
  duration: string;
  creatorStake: string;
  creatorStrategy: string;
}

const CreateCompetition: React.FC = () => {
  const { createCompetition, isReady } = useContract();
  const { isConnected, isOnSupportedNetwork, switchNetwork } = useWallet();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    minInvestment: '',
    duration: '24',
    creatorStake: '',
    creatorStrategy: ''
  });

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData.topic.trim()) errors.push('Topic is required');
    if (!formData.minInvestment || parseFloat(formData.minInvestment) <= 0) errors.push('Minimum investment must be > 0');
    if (!formData.creatorStake || parseFloat(formData.creatorStake) <= 0) errors.push('Creator stake must be > 0');
    if (!formData.creatorStrategy.trim()) errors.push('Creator strategy is required');
    if (parseInt(formData.duration) < 1) errors.push('Duration must be at least 1 hour');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setIsCreating(true);
    try {
      const params = {
        topic: formData.topic.trim(),
        minInvestment: formData.minInvestment,
        duration: parseInt(formData.duration) * 3600,
        creatorStake: formData.creatorStake,
        creatorStrategy: formData.creatorStrategy.trim()
      };

      const receipt = await createCompetition(params);
      console.log('Competition created:', receipt);
      
      setFormData({
        topic: '',
        minInvestment: '',
        duration: '24',
        creatorStake: '',
        creatorStrategy: ''
      });
      
      alert('Competition created successfully!');
    } catch (error) {
      console.error('Failed to create competition:', error);
      alert('Failed to create competition: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your wallet to create AI strategy competitions</p>
      </div>
    );
  }

  if (!isOnSupportedNetwork()) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Switch to Avalanche Fuji</h2>
        <p className="text-gray-400 mb-4">Competitions can only be created on Avalanche Fuji</p>
        <button
          onClick={() => switchNetwork(43113)}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Switch to Avalanche Fuji
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Create AI Strategy Competition</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Create a competition where participants submit investment strategies to be evaluated by AI. 
          As the creator, you compete alongside participants with your own strategy and stake.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-6 h-6 text-yellow-400 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Creator-as-Competitor Model</h3>
            <p className="text-gray-300 text-sm">
              Unlike traditional prediction markets, you compete with your own strategy and stake. 
              This ensures high-quality competitions and fair reward distribution based on AI evaluation scores.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Competition Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              placeholder="e.g., 'Best AI stock picks for Q2 2025' or 'Crypto portfolio strategy'"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              Clear, specific topic that participants can create strategies for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Minimum Investment (BET)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.minInvestment}
                onChange={(e) => handleInputChange('minInvestment', e.target.value)}
                placeholder="1.0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum amount participants must invest
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (Hours)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="1">1 Hour (Demo)</option>
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days</option>
                <option value="168">1 Week</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                How long participants have to join
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Your Stake (BET)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.creatorStake}
              onChange={(e) => handleInputChange('creatorStake', e.target.value)}
              placeholder="10.0"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your investment as the creator-competitor. This should demonstrate confidence in your strategy.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Lightbulb className="w-4 h-4 inline mr-2" />
              Your Strategy
            </label>
            <textarea
              value={formData.creatorStrategy}
              onChange={(e) => handleInputChange('creatorStrategy', e.target.value)}
              placeholder="Describe your investment strategy in detail. This will be evaluated by AI alongside participant strategies..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1">
              Detailed strategy description for AI evaluation ({formData.creatorStrategy.length}/1000 chars)
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">Estimated Creation Costs</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Gas Fees (Avalanche):</span>
                <span>~$0.10</span>
              </div>
              <div className="flex justify-between">
                <span>Your Stake:</span>
                <span>{formData.creatorStake || '0'} BET</span>
              </div>
              <div className="flex justify-between font-medium text-blue-300">
                <span>Total Required:</span>
                <span>{formData.creatorStake || '0'} BET + gas</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !isReady}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Competition...</span>
              </div>
            ) : (
              'Create Competition'
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Evaluation</h3>
          <p className="text-gray-400 text-sm">
            All strategies are evaluated by advanced AI algorithms for feasibility, risk assessment, and potential returns.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Fair Rewards</h3>
          <p className="text-gray-400 text-sm">
            Rewards are distributed based on AI scores and confidence-weighted investments, ensuring fair compensation.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Cross-Chain Access</h3>
          <p className="text-gray-400 text-sm">
            Participants can join from Ethereum Sepolia (CCIP) or Dispatch (Teleporter) with automatic bridging.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetition;