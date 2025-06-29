// services/redisService.js - COMPLETELY DISABLED VERSION FOR HACKATHON
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    
    // In-memory storage for hackathon demo
    this.memoryStorage = new Map();
    this.setStorage = new Map(); // For Redis sets
    this.hashStorage = new Map(); // For Redis hashes
    this.sortedSetStorage = new Map(); // For Redis sorted sets
    this.counterStorage = new Map(); // For Redis counters
    
    console.log('⚠️ Redis disabled - using in-memory storage for hackathon demo');
  }

  async connect() {
    console.log('📦 Using in-memory storage (Redis disabled for stability)');
    this.isConnected = true;
    return;
  }

  async disconnect() {
    console.log('📦 Memory storage cleared');
    this.memoryStorage.clear();
    this.setStorage.clear();
    this.hashStorage.clear();
    this.sortedSetStorage.clear();
    this.counterStorage.clear();
    this.isConnected = false;
  }

  // Basic operations using memory
  async get(key) {
    const value = this.memoryStorage.get(key);
    console.log(`📦 GET ${key}:`, value ? 'found' : 'not found');
    return value || null;
  }

  async set(key, value, options = {}) {
    this.memoryStorage.set(key, value);
    console.log(`📦 SET ${key}: stored`);
    
    if (options.ttl) {
      setTimeout(() => {
        this.memoryStorage.delete(key);
        console.log(`📦 TTL expired for ${key}`);
      }, options.ttl * 1000);
    }
    return true;
  }

  async del(key) {
    const existed = this.memoryStorage.has(key);
    this.memoryStorage.delete(key);
    console.log(`📦 DEL ${key}:`, existed ? 'deleted' : 'not found');
    return existed ? 1 : 0;
  }

  async exists(key) {
    const exists = this.memoryStorage.has(key);
    console.log(`📦 EXISTS ${key}:`, exists);
    return exists;
  }

  // Hash operations
  async hSet(key, field, value) {
    if (!this.hashStorage.has(key)) {
      this.hashStorage.set(key, new Map());
    }
    this.hashStorage.get(key).set(field, value);
    console.log(`📦 HSET ${key} ${field}: stored`);
    return true;
  }

  async hGet(key, field) {
    const hash = this.hashStorage.get(key);
    const value = hash ? hash.get(field) : null;
    console.log(`📦 HGET ${key} ${field}:`, value ? 'found' : 'not found');
    return value || null;
  }

  async hGetAll(key) {
    const hash = this.hashStorage.get(key);
    if (!hash) {
      console.log(`📦 HGETALL ${key}: not found`);
      return {};
    }
    
    const result = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    console.log(`📦 HGETALL ${key}: ${Object.keys(result).length} fields`);
    return result;
  }

  async hDel(key, field) {
    const hash = this.hashStorage.get(key);
    if (!hash) {
      console.log(`📦 HDEL ${key} ${field}: hash not found`);
      return 0;
    }
    
    const existed = hash.has(field);
    hash.delete(field);
    console.log(`📦 HDEL ${key} ${field}:`, existed ? 'deleted' : 'not found');
    return existed ? 1 : 0;
  }

  // Set operations
  async sAdd(key, member) {
    if (!this.setStorage.has(key)) {
      this.setStorage.set(key, new Set());
    }
    const existed = this.setStorage.get(key).has(member);
    this.setStorage.get(key).add(member);
    console.log(`📦 SADD ${key} ${member}:`, existed ? 'already exists' : 'added');
    return existed ? 0 : 1;
  }

  async sRem(key, member) {
    const set = this.setStorage.get(key);
    if (!set) {
      console.log(`📦 SREM ${key} ${member}: set not found`);
      return 0;
    }
    
    const existed = set.has(member);
    set.delete(member);
    console.log(`📦 SREM ${key} ${member}:`, existed ? 'removed' : 'not found');
    return existed ? 1 : 0;
  }

  async sMembers(key) {
    const set = this.setStorage.get(key);
    if (!set) {
      console.log(`📦 SMEMBERS ${key}: set not found`);
      return [];
    }
    
    const members = Array.from(set);
    console.log(`📦 SMEMBERS ${key}: ${members.length} members`);
    return members;
  }

  // Sorted set operations
  async zAdd(key, score, member) {
    if (!this.sortedSetStorage.has(key)) {
      this.sortedSetStorage.set(key, new Map());
    }
    this.sortedSetStorage.get(key).set(member, score);
    console.log(`📦 ZADD ${key} ${score} ${member}: added`);
    return 1;
  }

  async zRevRange(key, start, stop) {
    const sortedSet = this.sortedSetStorage.get(key);
    if (!sortedSet) {
      console.log(`📦 ZREVRANGE ${key}: sorted set not found`);
      return [];
    }

    // Convert to array and sort by score (descending)
    const entries = Array.from(sortedSet.entries());
    entries.sort((a, b) => b[1] - a[1]); // Sort by score descending
    
    const sliced = entries.slice(start, stop + 1);
    const result = [];
    
    // Return in format: [member, score, member, score, ...]
    for (const [member, score] of sliced) {
      result.push(member, score);
    }
    
    console.log(`📦 ZREVRANGE ${key}: ${result.length / 2} entries`);
    return result;
  }

  // Counter operations
  async incr(key) {
    const current = this.counterStorage.get(key) || 0;
    const newValue = current + 1;
    this.counterStorage.set(key, newValue);
    console.log(`📦 INCR ${key}: ${newValue}`);
    return newValue;
  }

  async expire(key, seconds) {
    if (this.memoryStorage.has(key)) {
      setTimeout(() => {
        this.memoryStorage.delete(key);
        console.log(`📦 TTL expired for ${key}`);
      }, seconds * 1000);
      console.log(`📦 EXPIRE ${key}: ${seconds}s`);
      return true;
    }
    return false;
  }

  async keys(pattern) {
    // Simple pattern matching for memory storage
    const allKeys = Array.from(this.memoryStorage.keys());
    let matchedKeys = allKeys;
    
    if (pattern !== '*') {
      const regex = new RegExp(pattern.replace('*', '.*'));
      matchedKeys = allKeys.filter(key => regex.test(key));
    }
    
    console.log(`📦 KEYS ${pattern}: ${matchedKeys.length} matches`);
    return matchedKeys;
  }

  async ping() {
    console.log('📦 PING: memory storage active');
    return 'PONG';
  }

  // Disabled pub/sub operations
  async publish(channel, message) {
    console.log(`📦 [DISABLED] Would publish to ${channel}`);
    return 1;
  }

  async subscribe(channel, callback) {
    console.log(`📦 [DISABLED] Would subscribe to ${channel}`);
  }

  async unsubscribe(channel) {
    console.log(`📦 [DISABLED] Would unsubscribe from ${channel}`);
    return true;
  }

  // Utility methods
  async ttl(key) {
    return this.memoryStorage.has(key) ? -1 : -2;
  }

  async multi() {
    console.log('📦 [DISABLED] Multi operations not supported in memory mode');
    return null;
  }

  isRedisAvailable() {
    return true; // Memory storage is always "available"
  }

  // Fallback methods (same as main methods in memory mode)
  async getWithFallback(key) {
    return await this.get(key);
  }

  async setWithFallback(key, value, options = {}) {
    return await this.set(key, value, options);
  }

  // Safe operation wrapper (not needed in memory mode)
  async safeOperation(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.error('Memory storage error:', error);
      return fallback;
    }
  }
}

module.exports = new RedisService();