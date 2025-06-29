// FILE: src/utils/transactionTracker.ts
// PLACE: Create this file in src/utils/ directory

export interface TrackedTransaction {
  hash: string;
  type: 'create' | 'join' | 'cross-chain-join';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  topic?: string;
  competitionId?: number;
  investment?: string;
  creatorStake?: string;
  crossChain?: boolean;
  fromChain?: number;
  toChain?: number;
  estimatedArrival?: number;
}

export class TransactionTracker {
  private trackedTransactions: Map<string, TrackedTransaction>;

  constructor() {
    this.trackedTransactions = new Map();
  }

  // Track a new transaction
  trackTransaction(
    txHash: string,
    type: TrackedTransaction['type'],
    details: Partial<TrackedTransaction> = {}
  ): TrackedTransaction {
    const transaction: TrackedTransaction = {
      hash: txHash,
      type,
      status: 'pending',
      timestamp: Date.now(),
      ...details
    };

    this.trackedTransactions.set(txHash, transaction);
    this.persistToStorage();
    
    return transaction;
  }

  // Update transaction status
  updateTransaction(txHash: string, updates: Partial<TrackedTransaction>): void {
    const tx = this.trackedTransactions.get(txHash);
    if (tx) {
      Object.assign(tx, updates);
      this.trackedTransactions.set(txHash, tx);
      this.persistToStorage();
    }
  }

  // Get all tracked transactions
  getAllTransactions(): TrackedTransaction[] {
    return Array.from(this.trackedTransactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get transaction by hash
  getTransaction(txHash: string): TrackedTransaction | undefined {
    return this.trackedTransactions.get(txHash);
  }

  // Clear old transactions (older than 24 hours)
  clearOldTransactions(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [hash, tx] of this.trackedTransactions) {
      if (tx.timestamp < oneDayAgo && tx.status === 'confirmed') {
        this.trackedTransactions.delete(hash);
      }
    }
    
    this.persistToStorage();
  }

  // Persist to localStorage (implement when using in real app)
  persistToStorage(): void {
    // In real implementation, save to localStorage
    // localStorage.setItem('trackedTransactions', JSON.stringify([...this.trackedTransactions]));
  }

  // Load from localStorage (implement when using in real app)
  loadFromStorage(): void {
    // In real implementation, load from localStorage
    // const stored = localStorage.getItem('trackedTransactions');
    // if (stored) {
    //   this.trackedTransactions = new Map(JSON.parse(stored));
    // }
  }
}

// Export singleton instance
export const transactionTracker = new TransactionTracker();