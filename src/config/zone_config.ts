export type ZONE_SERVERS_CONFIG = {
    label: string;
    position: { x: number; y: number };
  };
  
export const ZONE_SERVERS : Record<string, ZONE_SERVERS_CONFIG> = {
  'testZone': {
    label: 'Test Zone',
    position: { x: 600, y: 50 },
  },
  'solanaZone': {
    label: 'Solana Wallet Zone',
    position: { x: 600, y: 200 },
  }
}/// MOCK ZONE DATA
export interface ZoneData {
  label: string;
  connected: boolean;
  zoneType: string;
  overview: {
    status: string;
    resources: string;
    lastUpdated: string;
    uptime: string;
    region: string;
  };
  config: {
    autoScaling: string;
    maxInstances: number;
    healthChecks: string;
    loadBalancer: string;
    timeout: string;
  };
  logs: Array<{
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    timestamp: string;
  }>;
  metrics: {
    cpuUsage: number;
    memoryUsed: string;
    memoryTotal: string;
    requestsPerMin: number;
    responseTime: string;
    errorRate: string;
  };
}

const MOCK_DATABASE: Record<string, ZoneData> = {
  'testZone': {
    label: 'Frontend Production',
    connected: true,
    zoneType: 'Web',
    overview: {
      status: 'Active',
      resources: '24 components',
      lastUpdated: '1 minute ago',
      uptime: '99.9% (30 days)',
      region: 'us-east-1'
    },
    config: {
      autoScaling: 'Enabled',
      maxInstances: 15,
      healthChecks: 'Every 30s',
      loadBalancer: 'Application LB',
      timeout: '30s'
    },
    logs: [
      { level: 'INFO', message: 'Deployment successful v2.1.4', timestamp: '14:32:15' },
      { level: 'INFO', message: 'Auto-scaling triggered', timestamp: '14:28:03' },
      { level: 'WARN', message: 'High response time detected', timestamp: '14:25:42' },
      { level: 'INFO', message: 'Cache cleared successfully', timestamp: '14:20:11' }
    ],
    metrics: {
      cpuUsage: 78,
      memoryUsed: '3.2GB',
      memoryTotal: '8GB',
      requestsPerMin: 2847,
      responseTime: '245ms',
      errorRate: '0.02%'
    }
  },

  'api-gateway': {
    label: 'API Gateway',
    connected: true,
    zoneType: 'Service',
    overview: {
      status: 'Active',
      resources: '8 endpoints',
      lastUpdated: '3 minutes ago',
      uptime: '99.95% (30 days)',
      region: 'us-west-2'
    },
    config: {
      autoScaling: 'Enabled',
      maxInstances: 10,
      healthChecks: 'Every 15s',
      loadBalancer: 'Network LB',
      timeout: '60s'
    },
    logs: [
      { level: 'INFO', message: 'Rate limiting applied', timestamp: '14:35:22' },
      { level: 'DEBUG', message: 'Authentication token refreshed', timestamp: '14:33:18' },
      { level: 'INFO', message: 'New API version deployed', timestamp: '14:30:45' },
      { level: 'WARN', message: 'High request volume detected', timestamp: '14:27:33' }
    ],
    metrics: {
      cpuUsage: 45,
      memoryUsed: '1.8GB',
      memoryTotal: '4GB',
      requestsPerMin: 5421,
      responseTime: '125ms',
      errorRate: '0.01%'
    }
  },

  'database-cluster': {
    label: 'Database Cluster',
    connected: true,
    zoneType: 'Database',
    overview: {
      status: 'Active',
      resources: '3 replicas',
      lastUpdated: '5 minutes ago',
      uptime: '99.99% (30 days)',
      region: 'us-east-1'
    },
    config: {
      autoScaling: 'Disabled',
      maxInstances: 3,
      healthChecks: 'Every 60s',
      loadBalancer: 'Read Replicas',
      timeout: '300s'
    },
    logs: [
      { level: 'INFO', message: 'Backup completed successfully', timestamp: '14:30:00' },
      { level: 'INFO', message: 'Index optimization finished', timestamp: '14:15:33' },
      { level: 'DEBUG', message: 'Connection pool resized', timestamp: '14:10:22' },
      { level: 'INFO', message: 'Replica sync completed', timestamp: '14:05:11' }
    ],
    metrics: {
      cpuUsage: 32,
      memoryUsed: '12.5GB',
      memoryTotal: '32GB',
      requestsPerMin: 1876,
      responseTime: '45ms',
      errorRate: '0.00%'
    }
  },

  'auth-service': {
    label: 'Authentication Service',
    connected: false,
    zoneType: 'Microservice',
    overview: {
      status: 'Maintenance',
      resources: '6 instances',
      lastUpdated: '45 minutes ago',
      uptime: '98.5% (30 days)',
      region: 'us-west-1'
    },
    config: {
      autoScaling: 'Enabled',
      maxInstances: 8,
      healthChecks: 'Every 20s',
      loadBalancer: 'Application LB',
      timeout: '45s'
    },
    logs: [
      { level: 'WARN', message: 'Service entering maintenance mode', timestamp: '13:45:12' },
      { level: 'ERROR', message: 'JWT validation failed', timestamp: '13:42:33' },
      { level: 'INFO', message: 'Security patch applied', timestamp: '13:40:15' },
      { level: 'WARN', message: 'High error rate detected', timestamp: '13:38:44' }
    ],
    metrics: {
      cpuUsage: 15,
      memoryUsed: '800MB',
      memoryTotal: '2GB',
      requestsPerMin: 245,
      responseTime: '890ms',
      errorRate: '2.1%'
    }
  },

  'cdn-edge': {
    label: 'CDN Edge Nodes',
    connected: true,
    zoneType: 'CDN',
    overview: {
      status: 'Active',
      resources: '45 edge locations',
      lastUpdated: '2 minutes ago',
      uptime: '99.8% (30 days)',
      region: 'global'
    },
    config: {
      autoScaling: 'Auto',
      maxInstances: 100,
      healthChecks: 'Every 10s',
      loadBalancer: 'Geographic routing',
      timeout: '10s'
    },
    logs: [
      { level: 'INFO', message: 'Cache hit ratio: 94.2%', timestamp: '14:36:45' },
      { level: 'INFO', message: 'New edge location added', timestamp: '14:20:33' },
      { level: 'DEBUG', message: 'Purge request processed', timestamp: '14:18:22' },
      { level: 'INFO', message: 'Bandwidth limit increased', timestamp: '14:15:55' }
    ],
    metrics: {
      cpuUsage: 28,
      memoryUsed: '5.2GB',
      memoryTotal: '16GB',
      requestsPerMin: 12450,
      responseTime: '35ms',
      errorRate: '0.05%'
    }
  },

  'monitoring-stack': {
    label: 'Monitoring Stack',
    connected: true,
    zoneType: 'Observability',
    overview: {
      status: 'Active',
      resources: '12 collectors',
      lastUpdated: '1 minute ago',
      uptime: '99.7% (30 days)',
      region: 'us-central-1'
    },
    config: {
      autoScaling: 'Enabled',
      maxInstances: 6,
      healthChecks: 'Every 45s',
      loadBalancer: 'Round Robin',
      timeout: '120s'
    },
    logs: [
      { level: 'INFO', message: 'Alert threshold updated', timestamp: '14:37:12' },
      { level: 'DEBUG', message: 'Metrics ingestion rate: 50k/s', timestamp: '14:35:28' },
      { level: 'INFO', message: 'Dashboard refresh completed', timestamp: '14:33:45' },
      { level: 'WARN', message: 'Storage usage at 85%', timestamp: '14:31:22' }
    ],
    metrics: {
      cpuUsage: 55,
      memoryUsed: '6.8GB',
      memoryTotal: '12GB',
      requestsPerMin: 3250,
      responseTime: '180ms',
      errorRate: '0.08%'
    }
  }
};

export const getZoneData = (zoneId: string): ZoneData | null => {
  return MOCK_DATABASE[zoneId] || MOCK_DATABASE['monitoring-stack'];
};

export const getAllZoneIds = (): string[] => {
  return Object.keys(MOCK_DATABASE);
};

export default MOCK_DATABASE;
